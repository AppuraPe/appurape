using System.Security.Cryptography;
using System.Text;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Application.Services;

public class OrderDeliveryConfirmationService : IOrderDeliveryConfirmationService
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly byte[] _key;
    private readonly INotificationService? _notifications;

    public OrderDeliveryConfirmationService(IAppDbContext dbContext, ICurrentUserService currentUser, IConfiguration configuration, INotificationService? notifications = null)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _notifications = notifications;
        var configuredSecret = configuration["OrderConfirmation:Key"] ?? configuration["OrderConfirmation__Key"];
        if (configuredSecret?.StartsWith("__SET_", StringComparison.Ordinal) == true) configuredSecret = null;
        var secret = configuredSecret ?? configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(secret) || Encoding.UTF8.GetByteCount(secret) < 32)
            throw new InvalidOperationException("OrderConfirmation:Key must contain at least 32 bytes.");
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public async Task<OrderDeliveryConfirmationResponse> GetForCustomerAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await GetCustomerOrderAsync(orderId, cancellationToken);
        EnsureCodeCanBeShown(order);
        EnsureIssued(order, RequiredUserId());
        if (order.DeliveryConfirmationExpiresAtUtc <= DateTime.UtcNow &&
            !await _dbContext.OrderDeliveryConfirmationAudits.AnyAsync(x => x.OrderId == order.Id && x.CodeVersion == order.DeliveryConfirmationVersion && x.Action == "ExpiryNotified", cancellationToken))
        {
            AddAudit(order, RequiredUserId(), "ExpiryNotified", null);
            if (_notifications is not null)
                await _notifications.SendToUserAsync(RequiredUserId(), new EventPushNotificationRequest
                {
                    Title = "Código de entrega vencido",
                    Body = "Genera un código nuevo desde el detalle de tu pedido.",
                    Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "delivery_code_expired")
                }, cancellationToken);
        }
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(order);
    }

    public async Task<OrderDeliveryConfirmationResponse> RegenerateForCustomerAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await GetCustomerOrderAsync(orderId, cancellationToken);
        EnsureCodeCanBeShown(order);
        if (order.DeliveryConfirmationRegenerations >= 1)
            throw new AppException("Ya utilizaste la regeneración disponible. Contacta a soporte.");
        Regenerate(order, RequiredUserId(), "CustomerRegenerated", null);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyRegeneratedAsync(order, RequiredUserId(), cancellationToken);
        return Map(order);
    }

    public async Task<OrderDeliveryConfirmationResponse> RegenerateForAdminAsync(Guid orderId, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 5)
            throw new AppException("Debes indicar un motivo de al menos 5 caracteres.");
        var order = await _dbContext.Orders.FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken)
            ?? throw new AppException("No encontramos el pedido.");
        EnsureCodeCanBeShown(order);
        Regenerate(order, RequiredUserId(), "AdminRegenerated", reason.Trim());
        await _dbContext.SaveChangesAsync(cancellationToken);
        var customerUserId = await _dbContext.Customers.Where(x => x.Id == order.CustomerId).Select(x => x.UserId).FirstAsync(cancellationToken);
        await NotifyRegeneratedAsync(order, customerUserId, cancellationToken);
        return Map(order);
    }

    public void EnsureIssued(Order order, Guid actorUserId)
    {
        if (order.DeliveryConfirmationVersion > 0 && order.DeliveryConfirmationExpiresAtUtc.HasValue) return;
        order.DeliveryConfirmationVersion = 1;
        order.DeliveryConfirmationExpiresAtUtc = DateTime.UtcNow.Add(Lifetime);
        order.DeliveryConfirmationFailedAttempts = 0;
        order.DeliveryConfirmationLockedAtUtc = null;
        AddAudit(order, actorUserId, "Issued", null);
    }

    public async Task ValidateAsync(Order order, string code, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        if (order.DeliveryConfirmedAtUtc.HasValue) return;
        EnsureIssued(order, actorUserId);
        if (order.DeliveryConfirmationLockedAtUtc.HasValue || order.DeliveryConfirmationFailedAttempts >= MaxAttempts)
            throw new AppException("El código está bloqueado. El cliente debe regenerarlo o contactar a soporte.");
        if (order.DeliveryConfirmationExpiresAtUtc <= DateTime.UtcNow)
            throw new AppException("El código de entrega venció. El cliente debe regenerarlo.");

        var expected = DeriveCode(order.Id, order.DeliveryConfirmationVersion);
        var supplied = (code ?? string.Empty).Trim();
        if (supplied.Length != 6 || !CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(supplied.PadRight(6)[..6])))
        {
            order.DeliveryConfirmationFailedAttempts++;
            if (order.DeliveryConfirmationFailedAttempts >= MaxAttempts) order.DeliveryConfirmationLockedAtUtc = DateTime.UtcNow;
            AddAudit(order, actorUserId, "FailedAttempt", null);
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException(order.DeliveryConfirmationFailedAttempts >= MaxAttempts
                ? "El código fue bloqueado por demasiados intentos."
                : $"Código incorrecto. Quedan {MaxAttempts - order.DeliveryConfirmationFailedAttempts} intentos.");
        }

        order.DeliveryConfirmedAtUtc = DateTime.UtcNow;
        order.DeliveryConfirmedByUserId = actorUserId;
        order.DeliveryConfirmationFailedAttempts = 0;
        order.DeliveryConfirmationLockedAtUtc = null;
        AddAudit(order, actorUserId, "Confirmed", null);
    }

    private void Regenerate(Order order, Guid actorUserId, string action, string? reason)
    {
        order.DeliveryConfirmationVersion = Math.Max(1, order.DeliveryConfirmationVersion + 1);
        order.DeliveryConfirmationExpiresAtUtc = DateTime.UtcNow.Add(Lifetime);
        order.DeliveryConfirmationFailedAttempts = 0;
        order.DeliveryConfirmationLockedAtUtc = null;
        order.DeliveryConfirmationRegenerations++;
        AddAudit(order, actorUserId, action, reason);
    }

    private async Task<Order> GetCustomerOrderAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var userId = RequiredUserId();
        return await _dbContext.Orders.Include(x => x.Customer)
            .FirstOrDefaultAsync(x => x.Id == orderId && x.Customer.UserId == userId, cancellationToken)
            ?? throw new AppException("No encontramos el pedido.");
    }

    private static void EnsureCodeCanBeShown(Order order)
    {
        if (order.Status is OrderStatus.Pending or OrderStatus.Accepted or OrderStatus.Preparing)
            throw new AppException("El código estará disponible cuando el pedido esté listo.");
        if (order.Status is OrderStatus.Cancelled or OrderStatus.Delivered)
            throw new AppException("Este pedido ya no necesita un código de entrega.");
    }

    private OrderDeliveryConfirmationResponse Map(Order order) => new()
    {
        OrderId = order.Id,
        Code = DeriveCode(order.Id, order.DeliveryConfirmationVersion),
        ExpiresAtUtc = order.DeliveryConfirmationExpiresAtUtc!.Value,
        RemainingAttempts = Math.Max(0, MaxAttempts - order.DeliveryConfirmationFailedAttempts),
        CanRegenerate = order.DeliveryConfirmationRegenerations < 1,
        IsLocked = order.DeliveryConfirmationLockedAtUtc.HasValue
    };

    private string DeriveCode(Guid orderId, int version)
    {
        using var hmac = new HMACSHA256(_key);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes($"order-delivery:{orderId:N}:{version}"));
        return (BitConverter.ToUInt32(hash, 0) % 1_000_000).ToString("D6");
    }

    private void AddAudit(Order order, Guid actorUserId, string action, string? reason) => _dbContext.Add(new OrderDeliveryConfirmationAudit
    {
        Id = Guid.NewGuid(), OrderId = order.Id, ActorUserId = actorUserId, Action = action,
        CodeVersion = order.DeliveryConfirmationVersion, Reason = reason, CreatedAtUtc = DateTime.UtcNow
    });

    private Task NotifyRegeneratedAsync(Order order, Guid customerUserId, CancellationToken cancellationToken) =>
        _notifications?.SendToUserAsync(customerUserId, new EventPushNotificationRequest
        {
            Title = "Código de entrega actualizado",
            Body = "Consulta el nuevo código en el detalle de tu pedido. No lo compartas hasta recibirlo.",
            Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "delivery_code_regenerated")
        }, cancellationToken) ?? Task.CompletedTask;

    private Guid RequiredUserId() => _currentUser.UserId ?? throw new AppException("Debes iniciar sesión.");
}
