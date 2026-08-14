using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class AdminPaymentService : IAdminPaymentService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public AdminPaymentService(IAppDbContext dbContext, ICurrentUserService currentUserService, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyList<AdminPaymentListItemResponse>> GetPendingPaymentsAsync(CancellationToken cancellationToken = default)
    {
        var pendingPayments = await _dbContext.Payments
            .AsNoTracking()
            .Where(x =>
                x.Status == PaymentStatus.PendingConfirmation &&
                (x.Method == PaymentMethod.Yape || x.Method == PaymentMethod.Plin))
            .OrderBy(x => x.Order.CreatedAtUtc)
            .Select(x => new
            {
                OrderId = x.OrderId,
                CustomerName = x.Order.Customer.User.FirstName + " " + x.Order.Customer.User.LastName,
                BusinessName = x.Order.Restaurant.Name,
                PaymentMethod = x.Method.ToString(),
                PaymentStatus = x.Status.ToString(),
                OrderStatus = x.Order.Status.ToString(),
                Total = x.Amount,
                CreatedAtUtc = x.Order.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return pendingPayments
            .Select(x => new AdminPaymentListItemResponse
            {
                OrderId = x.OrderId,
                OrderCode = x.OrderId.ToString("N")[..8],
                CustomerName = x.CustomerName,
                BusinessName = x.BusinessName,
                PaymentMethod = x.PaymentMethod,
                PaymentStatus = x.PaymentStatus,
                OrderStatus = x.OrderStatus,
                Total = x.Total,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToList();
    }

    public async Task<AdminPaymentDetailResponse> GetPaymentByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var detail = await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.OrderId == orderId)
            .Select(x => new
            {
                OrderId = x.OrderId,
                CustomerName = x.Order.Customer.User.FirstName + " " + x.Order.Customer.User.LastName,
                CustomerPhone = x.Order.Customer.User.Phone,
                BusinessName = x.Order.Restaurant.Name,
                PaymentMethod = x.Method.ToString(),
                PaymentStatus = x.Status.ToString(),
                OrderStatus = x.Order.Status.ToString(),
                Subtotal = x.Order.Subtotal,
                DeliveryFee = x.Order.DeliveryFee,
                Total = x.Order.Total,
                PaymentReference = x.ManualReference ?? x.ExternalReference,
                PaymentProofUrl = (string?)null,
                CreatedAtUtc = x.Order.CreatedAtUtc,
                Items = x.Order.Items
                    .OrderBy(i => i.ProductName)
                    .Select(i => new AdminPaymentDetailItemResponse
                    {
                        ProductName = i.ProductName,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        Total = i.Subtotal
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (detail is null)
        {
            throw new NotFoundException("Payment was not found for this order.");
        }

        return new AdminPaymentDetailResponse
        {
            OrderId = detail.OrderId,
            OrderCode = detail.OrderId.ToString("N")[..8],
            CustomerName = detail.CustomerName,
            CustomerPhone = detail.CustomerPhone,
            BusinessName = detail.BusinessName,
            PaymentMethod = detail.PaymentMethod,
            PaymentStatus = detail.PaymentStatus,
            OrderStatus = detail.OrderStatus,
            Subtotal = detail.Subtotal,
            DeliveryFee = detail.DeliveryFee,
            Total = detail.Total,
            PaymentReference = detail.PaymentReference,
            PaymentProofUrl = detail.PaymentProofUrl,
            CreatedAtUtc = detail.CreatedAtUtc,
            Items = detail.Items
        };
    }

    public async Task<AdminPaymentDetailResponse> ConfirmPaymentAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var payment = await GetPendingManualPaymentAsync(orderId, cancellationToken);

        payment.Status = PaymentStatus.Paid;
        payment.ConfirmedByUserId = _currentUserService.UserId;
        payment.ConfirmedAtUtc = DateTime.UtcNow;
        payment.PaidAtUtc = payment.ConfirmedAtUtc;
        payment.RejectedAtUtc = null;
        payment.FailureReason = null;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyAdminPaymentConfirmedAsync(orderId, cancellationToken);
        return await GetPaymentByOrderIdAsync(orderId, cancellationToken);
    }

    public async Task<AdminPaymentDetailResponse> RejectPaymentAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var payment = await GetPendingManualPaymentAsync(orderId, cancellationToken);

        payment.Status = PaymentStatus.Rejected;
        payment.ConfirmedByUserId = _currentUserService.UserId;
        payment.RejectedAtUtc = DateTime.UtcNow;
        payment.FailureReason = payment.FailureReason ?? "Pago rechazado por administracion.";

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyAdminPaymentRejectedAsync(orderId, payment.FailureReason, cancellationToken);
        return await GetPaymentByOrderIdAsync(orderId, cancellationToken);
    }

    private async Task<Payment> GetPendingManualPaymentAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);

        if (payment is null)
        {
            throw new NotFoundException("Payment was not found for this order.");
        }

        if (payment.Method is not (PaymentMethod.Yape or PaymentMethod.Plin))
        {
            throw new AppException("Solo los pagos Yape o Plin pueden gestionarse desde esta vista.");
        }

        if (payment.Status == PaymentStatus.Paid)
        {
            throw new AppException("Este pago ya fue confirmado.");
        }

        if (payment.Status == PaymentStatus.Rejected)
        {
            throw new AppException("Este pago ya fue rechazado.");
        }

        if (payment.Status != PaymentStatus.PendingConfirmation)
        {
            throw new AppException("Este pago no esta pendiente de confirmacion.");
        }

        return payment;
    }

    private async Task NotifyAdminPaymentConfirmedAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var target = await _dbContext.Orders
            .Where(x => x.Id == orderId)
            .Select(x => new
            {
                x.Id,
                CustomerUserId = x.Customer.UserId,
                BusinessOwnerUserId = x.Restaurant.OwnerUserId,
                RestaurantName = x.Restaurant.Name
            })
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            target.CustomerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pago confirmado",
                Body = "Tu pago fue confirmado y el pedido ya puede avanzar.",
                Data = NotificationPayloadFactory.Order(target.Id, $"/orders/{target.Id}", "payment_confirmed")
            },
            cancellationToken);

        await _notificationService.SendToUserAsync(
            target.BusinessOwnerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pago confirmado por admin",
                Body = $"El pago del pedido #{target.Id.ToString("N")[..8]} ya fue confirmado para {target.RestaurantName}.",
                Data = NotificationPayloadFactory.BusinessOrder(target.Id, $"/business/orders/{target.Id}", "payment_confirmed_admin")
            },
            cancellationToken);
    }

    private async Task NotifyAdminPaymentRejectedAsync(Guid orderId, string? reason, CancellationToken cancellationToken)
    {
        var target = await _dbContext.Orders
            .Where(x => x.Id == orderId)
            .Select(x => new
            {
                CustomerUserId = x.Customer.UserId,
                BusinessOwnerUserId = x.Restaurant.OwnerUserId
            })
            .FirstAsync(cancellationToken);

        var body = string.IsNullOrWhiteSpace(reason)
            ? "Tu pago fue rechazado. Revisa el detalle del pedido."
            : $"Tu pago fue rechazado: {reason.Trim()}";

        await _notificationService.SendToUserAsync(
            target.CustomerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pago rechazado",
                Body = body,
                Data = NotificationPayloadFactory.Order(orderId, $"/orders/{orderId}", "payment_rejected")
            },
            cancellationToken);

        await _notificationService.SendToUserAsync(
            target.BusinessOwnerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pago rechazado por administración",
                Body = $"El pago del pedido #{orderId.ToString("N")[..8]} fue rechazado.",
                Data = NotificationPayloadFactory.BusinessOrder(orderId, $"/business/orders/{orderId}", "payment_rejected_admin")
            },
            cancellationToken);
    }
}
