using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Application.Services;

public class OrderFulfillmentService : IOrderFulfillmentService
{
    private static readonly TimeSpan QuoteLifetime = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan PickupCodeLifetime = TimeSpan.FromHours(12);
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;
    private readonly byte[] _quoteKey;

    public OrderFulfillmentService(
        IAppDbContext dbContext,
        ICurrentUserService currentUser,
        INotificationService notifications,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _notifications = notifications;
        var secret = configuration["Jwt:Key"] ?? configuration["Jwt__Key"];
        if (string.IsNullOrWhiteSpace(secret)) throw new InvalidOperationException("JWT key is required for signed fulfillment quotes.");
        _quoteKey = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public async Task<OrderFulfillmentOptionsResponse> GetOptionsAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await GetCustomerOrderAsync(orderId, cancellationToken);
        var linked = await _dbContext.CommunityRequests.AsNoTracking()
            .Where(x => x.OrderId == order.Id && x.Status != CommunityRequestStatus.Cancelled)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        var reason = ResolveUnavailableReason(order, linked);
        var payment = await _dbContext.Payments.AsNoTracking().FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken);
        var collaboratorReason = reason ?? (payment?.Status == PaymentStatus.Paid ? null : "Para solicitar un colaborador, primero confirma el pago de la compra con el negocio.");
        return new OrderFulfillmentOptionsResponse
        {
            OrderId = order.Id,
            CurrentDeliveryMode = order.DeliveryMode.ToString(),
            CanRequestDriver = reason is null && payment is not null && payment.Method == PaymentMethod.Cash && payment.Status == PaymentStatus.Pending,
            CanRequestCollaborator = collaboratorReason is null,
            UnavailableReason = reason ?? (payment?.Status != PaymentStatus.Paid && !(payment?.Method == PaymentMethod.Cash && payment.Status == PaymentStatus.Pending)
                ? collaboratorReason : null),
            LinkedCommunityRequestId = linked
        };
    }

    public async Task<OrderDriverDeliveryResponse> RequestDriverDeliveryAsync(
        Guid orderId,
        RequestOrderDriverDeliveryRequest request,
        CancellationToken cancellationToken = default)
    {
        var order = await GetCustomerOrderAsync(orderId, cancellationToken);
        var linked = await ActiveLinkedRequestIdAsync(order.Id, cancellationToken);
        var reason = ResolveUnavailableReason(order, linked);
        if (reason is not null) throw new AppException(reason);
        var payment = await _dbContext.Payments.FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken)
            ?? throw new AppException("No encontramos el pago asociado al pedido.");
        if (payment.Method != PaymentMethod.Cash || payment.Status != PaymentStatus.Pending)
            throw new AppException("Solo puedes agregar delivery después de comprar cuando el pago en efectivo sigue pendiente.");

        var driverDestination = await ResolveDestinationAsync(order, request.CustomerAddressId, request.ZoneId, request.DeliveryAddress, request.DeliveryReference, cancellationToken);
        ApplyDestination(order, driverDestination);
        var now = DateTime.UtcNow;
        var rules = await _dbContext.CommissionRules.AsNoTracking()
            .Where(x => x.Scope == CommissionRuleScope.CommercialOrder && x.IsEnabled &&
                (!x.EffectiveFromUtc.HasValue || x.EffectiveFromUtc <= now) &&
                (!x.EffectiveToUtc.HasValue || x.EffectiveToUtc >= now))
            .OrderByDescending(x => x.Priority).ToListAsync(cancellationToken);
        var breakdown = FinancialCalculator.CalculateCommercialOrder(
            order.Subtotal,
            DeliveryMode.VerifiedDriverDelivery,
            request.OfferedDeliveryAmount,
            order.Restaurant.HasOwnDelivery,
            order.Restaurant.OwnDeliveryFee,
            rules);

        order.DeliveryMode = DeliveryMode.VerifiedDriverDelivery;
        order.BusinessCommissionAmount = breakdown.BusinessCommissionAmount;
        order.BusinessNetAmount = breakdown.BusinessNetAmount;
        order.DeliveryFee = breakdown.DeliveryFee;
        order.DeliveryMinimumAmount = breakdown.DeliveryMinimumAmount;
        order.DeliveryPlatformCommissionAmount = breakdown.DeliveryPlatformCommissionAmount;
        order.CourierEarningAmount = breakdown.CourierEarningAmount;
        order.ServiceFeeAmount = breakdown.ServiceFeeAmount;
        order.DiscountAmount = breakdown.DiscountAmount;
        order.PlatformRevenueAmount = breakdown.PlatformRevenueAmount;
        order.Total = breakdown.Total;
        order.PricingSnapshotJson = FinancialCalculator.SerializeCommercialSnapshot(breakdown, rules);
        payment.Amount = breakdown.Total;
        var cashDebt = await _dbContext.FinancialMovements
            .FirstOrDefaultAsync(x => x.OrderId == order.Id && x.Type == FinancialMovementType.CashOrderDebt && x.Status == FinancialMovementStatus.Pending, cancellationToken);
        if (cashDebt is not null)
        {
            cashDebt.Amount = breakdown.PlatformRevenueAmount;
        }
        else if (breakdown.PlatformRevenueAmount > 0m)
        {
            _dbContext.Add(new FinancialMovement
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                RestaurantId = order.RestaurantId,
                Type = FinancialMovementType.CashOrderDebt,
                Status = FinancialMovementStatus.Pending,
                Amount = breakdown.PlatformRevenueAmount,
                CurrencyCode = "PEN",
                OccurredAtUtc = DateTime.UtcNow,
                Reference = $"ORDER-{order.Id:N}",
                Description = "Deuda actualizada al agregar delivery verificado al pedido."
            });
        }
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new OrderDriverDeliveryResponse
        {
            OrderId = order.Id,
            DeliveryMode = order.DeliveryMode.ToString(),
            DeliveryFee = order.DeliveryFee,
            Total = order.Total
        };
    }

    public async Task<OrderCollaboratorPickupQuoteResponse> QuoteCollaboratorPickupAsync(
        Guid orderId,
        OrderCollaboratorPickupQuoteRequest request,
        CancellationToken cancellationToken = default)
    {
        var order = await GetCustomerOrderAsync(orderId, cancellationToken);
        var linked = await ActiveLinkedRequestIdAsync(order.Id, cancellationToken);
        var reason = ResolveUnavailableReason(order, linked);
        if (reason is not null) throw new AppException(reason);
        await EnsurePurchasePaidForCollaboratorAsync(order.Id, cancellationToken);

        var rules = await ActiveCommunityRulesAsync(cancellationToken);
        var minimum = ResolveRuleAmount(rules, FinancialRuleCodes.SimpleFavorMinimum, 2m);
        if (request.CompensationAmount < minimum)
            throw new AppException($"El pago al colaborador debe ser como mínimo S/ {minimum:0.00}.");

        var destination = await ResolveDestinationAsync(order, request.CustomerAddressId, request.ZoneId, request.DeliveryAddress, request.DeliveryReference, cancellationToken);
        var now = DateTime.UtcNow;
        var deadline = request.DeadlineUtc ?? now.AddHours(12);
        if (deadline <= now || deadline > now.AddHours(24))
            throw new AppException("La fecha límite debe estar dentro de las próximas 24 horas.");

        var breakdown = FinancialCalculator.CalculateCommunityRequest(request.CompensationAmount, 0m, rules);
        var expires = now.Add(QuoteLifetime);
        var payload = new QuotePayload(order.Id, breakdown.CompensationAmount, breakdown.FavorPlatformCommissionAmount, breakdown.TotalClientAmount, deadline, expires,
            destination.ZoneId, destination.Address, destination.Reference);
        return new OrderCollaboratorPickupQuoteResponse
        {
            OrderId = order.Id,
            CollaboratorEarningAmount = breakdown.CollaboratorEarningAmount,
            TotalAdditionalAmount = breakdown.TotalClientAmount,
            DeadlineUtc = deadline,
            QuoteExpiresAtUtc = expires,
            QuoteToken = Sign(payload)
        };
    }

    public async Task<OrderCollaboratorPickupResponse> CreateCollaboratorPickupAsync(
        Guid orderId,
        CreateOrderCollaboratorPickupRequest request,
        CancellationToken cancellationToken = default)
    {
        var quote = Verify(request.QuoteToken);
        if (quote.OrderId != orderId || quote.ExpiresAtUtc < DateTime.UtcNow)
            throw new AppException("La cotización venció. Solicita una nueva antes de confirmar.");

        var order = await GetCustomerOrderAsync(orderId, cancellationToken);
        var linked = await ActiveLinkedRequestIdAsync(order.Id, cancellationToken);
        var reason = ResolveUnavailableReason(order, linked);
        if (reason is not null) throw new AppException(reason);
        await EnsurePurchasePaidForCollaboratorAsync(order.Id, cancellationToken);

        var rules = await ActiveCommunityRulesAsync(cancellationToken);
        var recalculated = FinancialCalculator.CalculateCommunityRequest(quote.CompensationAmount, 0m, rules);
        if (recalculated.FavorPlatformCommissionAmount != quote.PlatformCommissionAmount || recalculated.TotalClientAmount != quote.TotalAdditionalAmount)
            throw new AppException("La tarifa cambió. Solicita una nueva cotización.");

        ApplyDestination(order, new ResolvedDestination(quote.ZoneId, quote.DeliveryAddress, quote.DeliveryReference));
        var userId = RequiredUserId();
        var pickupCode = GenerateCode();
        var deliveryCode = GenerateCode();
        var communityRequest = new CommunityRequest
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Order = order,
            SourceType = CommunityRequestSourceType.AppuraPeOrder,
            CreatedByUserId = userId,
            Type = CommunityRequestType.ProductPickup,
            Title = $"Recoger pedido en {order.Restaurant.Name}",
            Description = $"Pedido #{order.Id.ToString()[..8].ToUpperInvariant()} listo para trasladar desde el negocio hasta el cliente.",
            OriginLabel = order.Restaurant.Address,
            DestinationLabel = "Dirección del cliente (visible al ser seleccionado)",
            CompensationAmount = recalculated.CompensationAmount,
            EstimatedPurchaseAmount = 0m,
            FavorPlatformCommissionAmount = recalculated.FavorPlatformCommissionAmount,
            CollaboratorEarningAmount = recalculated.CollaboratorEarningAmount,
            TotalClientAmount = recalculated.TotalClientAmount,
            PlatformRevenueAmount = recalculated.PlatformRevenueAmount,
            PricingSnapshotJson = FinancialCalculator.SerializeCommunitySnapshot(recalculated, rules),
            DeadlineUtc = quote.DeadlineUtc,
            Status = CommunityRequestStatus.Published,
            ConfirmationCode = deliveryCode,
            ConfirmationCodeExpiresAtUtc = quote.DeadlineUtc,
            PickupCode = pickupCode,
            PickupCodeExpiresAtUtc = DateTime.UtcNow.Add(PickupCodeLifetime)
        };

        order.DeliveryMode = DeliveryMode.CommunityCollaboratorDelivery;
        order.AssignedCourierUserId = null;
        order.AssignedCourierType = null;
        order.DriverId = null;
        _dbContext.Add(communityRequest);
        _dbContext.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            CommunityRequestId = communityRequest.Id,
            Type = FinancialMovementType.CourierEarning,
            Status = FinancialMovementStatus.Pending,
            Amount = communityRequest.CollaboratorEarningAmount,
            CurrencyCode = "PEN",
            Description = "Ganancia reservada para quien recoja la compra AppuraPe.",
            Reference = $"FAVOR-{communityRequest.Id.ToString()[..8].ToUpperInvariant()}",
            OccurredAtUtc = DateTime.UtcNow
        });
        _dbContext.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            CommunityRequestId = communityRequest.Id,
            Type = FinancialMovementType.CashFavorDebt,
            Status = FinancialMovementStatus.Pending,
            Amount = communityRequest.FavorPlatformCommissionAmount,
            CurrencyCode = "PEN",
            Description = "Comisión del recojo de una compra AppuraPe.",
            Reference = $"FAVOR-{communityRequest.Id.ToString()[..8].ToUpperInvariant()}",
            OccurredAtUtc = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyAvailableCollaboratorsAsync(order, communityRequest, cancellationToken);

        return Map(communityRequest);
    }

    public async Task<OrderCollaboratorPickupResponse> ConfirmBusinessPickupAsync(
        Guid orderId,
        ConfirmCollaboratorPickupRequest request,
        CancellationToken cancellationToken = default)
    {
        var restaurantUserId = RequiredUserId();
        var communityRequest = await _dbContext.CommunityRequests
            .Include(x => x.Order!).ThenInclude(x => x.Restaurant)
            .Include(x => x.AssignedCollaborator).ThenInclude(x => x!.User)
            .FirstOrDefaultAsync(x => x.OrderId == orderId && x.Status != CommunityRequestStatus.Cancelled, cancellationToken)
            ?? throw new NotFoundException("No existe un recojo por colaborador para este pedido.");
        var order = communityRequest.Order!;
        if (order.Restaurant.OwnerUserId != restaurantUserId) throw new ForbiddenException("No tienes acceso a este pedido.");
        if (communityRequest.AssignedCollaborator is null || communityRequest.Status != CommunityRequestStatus.Accepted)
            throw new AppException("El pedido todavía no tiene un colaborador listo para recoger.");
        if (order.Status != OrderStatus.ReadyForPickup && order.Status != OrderStatus.Assigned)
            throw new AppException("El pedido debe estar listo para recojo.");
        if (communityRequest.PickupCodeExpiresAtUtc < DateTime.UtcNow)
            throw new AppException("El código de recojo venció.");
        if (!string.Equals(communityRequest.PickupCode, request.PickupCode.Trim(), StringComparison.Ordinal))
            throw new AppException("El código de recojo no es válido.");

        var now = DateTime.UtcNow;
        communityRequest.PickupConfirmedAtUtc = now;
        communityRequest.StartedAtUtc = now;
        communityRequest.Status = CommunityRequestStatus.InProcess;
        order.PickedUpAtUtc = now;
        order.Status = OrderStatus.PickedUp;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notifications.SendToUserAsync(communityRequest.CreatedByUserId, new EventPushNotificationRequest
        {
            Title = "Tu pedido fue recogido",
            Body = $"El colaborador recogió tu pedido en {order.Restaurant.Name}.",
            Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "collaborator_order_picked_up")
        }, cancellationToken);
        return Map(communityRequest);
    }

    private async Task<Order> GetCustomerOrderAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var userId = RequiredUserId();
        return await _dbContext.Orders
            .Include(x => x.Customer)
            .Include(x => x.Restaurant)
            .FirstOrDefaultAsync(x => x.Id == orderId && x.Customer.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("No encontramos el pedido solicitado.");
    }

    private static string? ResolveUnavailableReason(Order order, Guid? linkedRequestId)
    {
        if (linkedRequestId.HasValue) return "Este pedido ya tiene un recojo por colaborador activo.";
        if (order.AssignedCourierUserId.HasValue || order.DriverId.HasValue) return "Este pedido ya tiene un repartidor asignado.";
        if (order.DeliveryMode != DeliveryMode.PickupOrDirect) return "Solo un pedido configurado para recojo personal puede cambiar a colaborador.";
        if (order.Status is OrderStatus.Cancelled or OrderStatus.Delivered or OrderStatus.PickedUp or OrderStatus.OnTheWay)
            return "El estado actual del pedido ya no permite solicitar un recojo.";
        return null;
    }

    private Task<Guid?> ActiveLinkedRequestIdAsync(Guid orderId, CancellationToken cancellationToken) =>
        _dbContext.CommunityRequests.AsNoTracking()
            .Where(x => x.OrderId == orderId && x.Status != CommunityRequestStatus.Cancelled)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

    private async Task EnsurePurchasePaidForCollaboratorAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var payment = await _dbContext.Payments.AsNoTracking().FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);
        if (payment?.Status != PaymentStatus.Paid)
            throw new AppException("Para solicitar un colaborador, primero confirma el pago de la compra con el negocio.");
    }

    private async Task<ResolvedDestination> ResolveDestinationAsync(
        Order order, Guid? customerAddressId, Guid? zoneId, string? address, string? reference, CancellationToken cancellationToken)
    {
        if (customerAddressId.HasValue)
        {
            var saved = await _dbContext.CustomerAddresses.AsNoTracking().FirstOrDefaultAsync(x =>
                x.Id == customerAddressId.Value && x.CustomerProfileId == order.CustomerId && x.IsActive, cancellationToken)
                ?? throw new AppException("La dirección seleccionada no está disponible.");
            return new ResolvedDestination(saved.ZoneId, saved.AddressLine, saved.Reference);
        }
        if (order.ZoneId != Guid.Empty && !string.IsNullOrWhiteSpace(order.DeliveryAddress) && !string.IsNullOrWhiteSpace(order.DeliveryReference))
            return new ResolvedDestination(order.ZoneId, order.DeliveryAddress, order.DeliveryReference);
        if (!zoneId.HasValue || zoneId == Guid.Empty || string.IsNullOrWhiteSpace(address) || string.IsNullOrWhiteSpace(reference))
            throw new AppException("Selecciona o ingresa una dirección de entrega completa.");
        var zoneExists = await _dbContext.Zones.AnyAsync(x => x.Id == zoneId.Value && x.IsActive, cancellationToken);
        if (!zoneExists) throw new AppException("La zona seleccionada no está disponible.");
        return new ResolvedDestination(zoneId.Value, address.Trim(), reference.Trim());
    }

    private static void ApplyDestination(Order order, ResolvedDestination destination)
    {
        order.ZoneId = destination.ZoneId;
        order.DeliveryAddress = destination.Address;
        order.DeliveryReference = destination.Reference;
    }

    private async Task<List<CommissionRule>> ActiveCommunityRulesAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.CommissionRules.AsNoTracking()
            .Where(x => x.Scope == CommissionRuleScope.CommunityRequest && x.IsEnabled &&
                (!x.EffectiveFromUtc.HasValue || x.EffectiveFromUtc <= now) &&
                (!x.EffectiveToUtc.HasValue || x.EffectiveToUtc >= now))
            .OrderByDescending(x => x.Priority).ToListAsync(cancellationToken);
    }

    private async Task NotifyAvailableCollaboratorsAsync(Order order, CommunityRequest request, CancellationToken cancellationToken)
    {
        var ids = await _dbContext.CommunityCollaborators
            .Where(x => x.IsAvailable && x.AvailabilityStatus == CommunityAvailabilityStatus.Available &&
                x.User.Status == UserStatus.Active && x.User.CollaboratorProfile != null &&
                x.User.CollaboratorProfile.ApprovalStatus == ApprovalStatus.Approved &&
                x.User.CollaboratorProfile.IsIdentityVerified)
            .Select(x => x.UserId).Distinct().ToListAsync(cancellationToken);
        await _notifications.SendToUsersAsync(ids, new EventPushNotificationRequest
        {
            Title = "Recojo disponible",
            Body = $"Hay una compra lista para coordinar en {order.Restaurant.Name}.",
            Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "order_pickup_published")
        }, cancellationToken);
    }

    private string Sign(QuotePayload payload)
    {
        var body = Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(payload));
        using var hmac = new HMACSHA256(_quoteKey);
        var signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(body)));
        return $"{body}.{signature}";
    }

    private QuotePayload Verify(string token)
    {
        try
        {
            var parts = token.Split('.', 2);
            if (parts.Length != 2) throw new FormatException();
            using var hmac = new HMACSHA256(_quoteKey);
            var expected = hmac.ComputeHash(Encoding.UTF8.GetBytes(parts[0]));
            var provided = Convert.FromBase64String(parts[1]);
            if (!CryptographicOperations.FixedTimeEquals(expected, provided)) throw new FormatException();
            return JsonSerializer.Deserialize<QuotePayload>(Convert.FromBase64String(parts[0])) ?? throw new FormatException();
        }
        catch (Exception exception) when (exception is FormatException or JsonException)
        {
            throw new AppException("La cotización no es válida. Solicita una nueva.");
        }
    }

    private Guid RequiredUserId() => _currentUser.UserId ?? throw new UnauthorizedException("Debes iniciar sesión.");
    private static string GenerateCode() => RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    private static decimal ResolveRuleAmount(IEnumerable<CommissionRule> rules, string code, decimal fallback) =>
        rules.FirstOrDefault(x => x.Code == code)?.Value ?? fallback;
    private static OrderCollaboratorPickupResponse Map(CommunityRequest request) => new()
    {
        OrderId = request.OrderId!.Value,
        CommunityRequestId = request.Id,
        Status = request.Status.ToString(),
        TotalAdditionalAmount = request.TotalClientAmount
    };

    private sealed record ResolvedDestination(Guid ZoneId, string Address, string Reference);
    private sealed record QuotePayload(Guid OrderId, decimal CompensationAmount, decimal PlatformCommissionAmount, decimal TotalAdditionalAmount,
        DateTime DeadlineUtc, DateTime ExpiresAtUtc, Guid ZoneId, string DeliveryAddress, string DeliveryReference);
}
