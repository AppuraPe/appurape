using System.Linq.Expressions;
using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.DTOs.Drivers;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace IquitosDelivery.Application.Services;

public class DriverOrderService : IDriverOrderService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly IValidator<UpdateDriverOrderStatusRequest> _updateDriverOrderStatusValidator;

    public DriverOrderService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IValidator<UpdateDriverOrderStatusRequest> updateDriverOrderStatusValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _updateDriverOrderStatusValidator = updateDriverOrderStatusValidator;
    }

    public async Task<IReadOnlyList<AvailableDriverOrderListItemResponse>> GetAvailableOrdersAsync(
        DriverAvailableOrderFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var query = _dbContext.Orders
            .Where(x =>
                x.Status == OrderStatus.ReadyForPickup &&
                x.DriverId == null &&
                x.AssignedCourierUserId == null &&
                x.ZoneId == driver.ZoneId);

        if (searchTerm is not null)
        {
            query = query.Where(x =>
                x.Restaurant.Name.ToLower().Contains(searchTerm) ||
                x.DeliveryAddress.ToLower().Contains(searchTerm) ||
                x.Zone.Name.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderByDescending(x => x.ReadyAtUtc ?? x.CreatedAtUtc)
            .Select(x => new AvailableDriverOrderListItemResponse
            {
                Id = x.Id,
                OrderCode = x.Id.ToString(),
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant.Name,
                PickupAddress = x.Restaurant.Address,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                CustomerName = x.Customer.User.FirstName + " " + x.Customer.User.LastName,
                Status = x.Status.ToString(),
                DeliveryAddress = x.DeliveryAddress,
                DeliveryReference = x.DeliveryReference,
                CourierEarningAmount = x.CourierEarningAmount,
                DeliveryFee = x.DeliveryFee,
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
                PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
                AssignedCourierUserId = x.AssignedCourierUserId,
                AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
                CreatedAtUtc = x.CreatedAtUtc,
                ReadyAtUtc = x.ReadyAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DriverOrderDetailResponse> GetAvailableOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);

        var order = await _dbContext.Orders
            .Where(x =>
                x.Id == orderId &&
                x.Status == OrderStatus.ReadyForPickup &&
                x.DriverId == null &&
                x.AssignedCourierUserId == null &&
                x.ZoneId == driver.ZoneId)
            .Select(MapDriverOrderDetail())
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order is not available for this driver.");
        }

        return order;
    }

    public async Task<DriverOrderDetailResponse?> GetActiveOrderAsync(CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);

        return await _dbContext.Orders
            .Where(x =>
                x.AssignedCourierUserId == driver.UserId &&
                x.AssignedCourierType == CourierType.Driver &&
                (x.Status == OrderStatus.Assigned || x.Status == OrderStatus.PickedUp || x.Status == OrderStatus.OnTheWay))
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(MapDriverOrderDetail())
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<DriverOrderDetailResponse> GetDriverOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);

        var order = await _dbContext.Orders
            .AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.Status,
                x.ZoneId,
                x.AssignedCourierUserId,
                x.AssignedCourierType
            })
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (order.AssignedCourierUserId is not null &&
            (order.AssignedCourierUserId != driver.UserId || order.AssignedCourierType != CourierType.Driver))
        {
            throw new ForbiddenException("You are not allowed to access this order.");
        }

        var canSeeAvailable =
            order.Status == OrderStatus.ReadyForPickup &&
            order.AssignedCourierUserId == null &&
            order.ZoneId == driver.ZoneId;

        var canSeeAssigned =
            order.AssignedCourierUserId == driver.UserId &&
            order.AssignedCourierType == CourierType.Driver;

        if (!canSeeAvailable && !canSeeAssigned)
        {
            throw new ForbiddenException("You are not allowed to access this order.");
        }

        var detail = await _dbContext.Orders
            .Where(x => x.Id == orderId)
            .Select(MapDriverOrderDetail())
            .FirstOrDefaultAsync(cancellationToken);

        if (detail is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        return detail;
    }

    public async Task<DriverOrderDetailResponse> TakeOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);

        if (_dbContext is not DbContext dbContext)
        {
            throw new InvalidOperationException("Driver order assignment requires a DbContext-backed implementation.");
        }

        var useTransaction = dbContext.Database.IsRelational();
        await using var transaction = useTransaction ? await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken) : null;

        try
        {
            await EnsureDriverHasNoActiveOrderAsync(driver.Id, cancellationToken);

            var order = await _dbContext.Orders
                .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

            if (order is null)
            {
                throw new NotFoundException("Order was not found.");
            }

            if (order.ZoneId != driver.ZoneId)
            {
                throw new AppException("Order is outside the driver's zone.");
            }

            if (order.DriverId is not null || order.AssignedCourierUserId is not null)
            {
                throw new AppException("Este pedido ya fue tomado por otro repartidor.");
            }

            if (order.Status != OrderStatus.ReadyForPickup)
            {
                throw new AppException("Order is not ready for pickup.");
            }

            var payment = await _dbContext.Payments
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken);

            EnsurePaymentAllowsOperationalProgress(order, payment);

            order.DriverId = driver.Id;
            order.AssignedCourierUserId = driver.UserId;
            order.AssignedCourierType = CourierType.Driver;
            order.Status = OrderStatus.Assigned;
            driver.IsAvailable = false;
            await AssignCourierFinancialMovementsAsync(order.Id, driver.UserId, cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            await NotifyBusinessAboutDriverAssignmentAsync(order.Id, cancellationToken);
        }
        catch
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }

            throw;
        }

        return await GetMyOrderByIdAsync(orderId, cancellationToken);
    }

    public async Task<IReadOnlyList<DriverAssignedOrderListItemResponse>> GetMyAssignedOrdersAsync(
        DriverAssignedOrderFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var query = _dbContext.Orders
            .Where(x => x.AssignedCourierUserId == driver.UserId && x.AssignedCourierType == CourierType.Driver);

        if (filters.Status.HasValue)
        {
            query = query.Where(x => x.Status == filters.Status.Value);
        }

        if (searchTerm is not null)
        {
            query = query.Where(x =>
                x.Restaurant.Name.ToLower().Contains(searchTerm) ||
                x.DeliveryAddress.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new DriverAssignedOrderListItemResponse
            {
                Id = x.Id,
                OrderCode = x.Id.ToString(),
                RestaurantName = x.Restaurant.Name,
                CustomerName = x.Customer.User.FirstName + " " + x.Customer.User.LastName,
                Status = x.Status.ToString(),
                CourierEarningAmount = x.CourierEarningAmount,
                DeliveryFee = x.DeliveryFee,
                Total = x.Total,
                DeliveryAddress = x.DeliveryAddress,
                PaymentMethod = x.PaymentMethod.ToString(),
                PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
                AssignedCourierUserId = x.AssignedCourierUserId,
                AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
                CreatedAtUtc = x.CreatedAtUtc,
                ReadyAtUtc = x.ReadyAtUtc,
                PickedUpAtUtc = x.PickedUpAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DriverOrderDetailResponse> GetMyOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);

        var orderExists = await _dbContext.Orders.AnyAsync(x => x.Id == orderId, cancellationToken);
        if (!orderExists)
        {
            throw new NotFoundException("Order was not found.");
        }

        var order = await _dbContext.Orders
            .Where(x =>
                x.Id == orderId &&
                x.AssignedCourierUserId == driver.UserId &&
                x.AssignedCourierType == CourierType.Driver)
            .Select(MapDriverOrderDetail())
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            throw new ForbiddenException("You are not allowed to access this order.");
        }

        return order;
    }

    public async Task<DriverOrderDetailResponse> UpdateMyOrderStatusAsync(Guid orderId, UpdateDriverOrderStatusRequest request, CancellationToken cancellationToken = default)
    {
        await _updateDriverOrderStatusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);

        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (order.AssignedCourierUserId != driver.UserId || order.AssignedCourierType != CourierType.Driver)
        {
            throw new ForbiddenException("You are not allowed to update this order.");
        }

        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken);

        if (order.Status == request.Status && request.Status == OrderStatus.Delivered)
        {
            return await GetMyOrderByIdAsync(order.Id, cancellationToken);
        }

        if (request.Status == OrderStatus.Delivered)
        {
            EnsurePaymentAllowsOperationalProgress(order, payment);
        }

        EnsureValidDriverTransition(order.Status, request.Status);

        if (_dbContext is not DbContext dbContext)
        {
            throw new InvalidOperationException("Order delivery updates require a DbContext-backed implementation.");
        }

        var useTransaction = dbContext.Database.IsRelational();
        await using var transaction = useTransaction ? await dbContext.Database.BeginTransactionAsync(cancellationToken) : null;

        try
        {
            order.Status = request.Status;

            if (request.Status == OrderStatus.PickedUp)
            {
                order.PickedUpAtUtc = DateTime.UtcNow;
            }

            if (request.Status == OrderStatus.OnTheWay)
            {
                order.PickedUpAtUtc ??= DateTime.UtcNow;
            }

            if (request.Status == OrderStatus.Delivered)
            {
                var deliveredAtUtc = DateTime.UtcNow;
                order.DeliveredAtUtc = deliveredAtUtc;
                driver.IsAvailable = true;
                await MarkOrderFinancialMovementsAvailableAsync(order.Id, cancellationToken);
                await RegisterCompletedDeliveryAsync(driver, cancellationToken);
                CloseCashPaymentOnDelivery(payment, driver.UserId, deliveredAtUtc);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            await NotifyCustomerAboutDriverStatusAsync(order, request.Status, cancellationToken);
        }
        catch
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }

            throw;
        }

        return await GetMyOrderByIdAsync(order.Id, cancellationToken);
    }

    private async Task<DriverProfile> GetCurrentApprovedDriverAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var driver = await _dbContext.Drivers
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.UserId == _currentUserService.UserId.Value, cancellationToken);

        if (driver is null)
        {
            throw new AppException("Authenticated user does not have a driver profile.");
        }

        if (driver.ApprovalStatus != ApprovalStatus.Approved || driver.User.Status != UserStatus.Active)
        {
            throw new AppException("Driver account is not approved for deliveries.");
        }

        return driver;
    }

    private async Task EnsureDriverHasNoActiveOrderAsync(Guid driverId, CancellationToken cancellationToken)
    {
        var hasActiveOrder = await _dbContext.Orders.AnyAsync(
            x => x.DriverId == driverId &&
                 (x.Status == OrderStatus.Assigned || x.Status == OrderStatus.PickedUp || x.Status == OrderStatus.OnTheWay),
            cancellationToken);

        if (hasActiveOrder)
        {
            throw new AppException("Driver already has an active order.");
        }
    }

    private static void EnsureValidDriverTransition(OrderStatus currentStatus, OrderStatus nextStatus)
    {
        var isValid = currentStatus switch
        {
            OrderStatus.Assigned => nextStatus == OrderStatus.PickedUp,
            OrderStatus.PickedUp => nextStatus == OrderStatus.OnTheWay,
            OrderStatus.OnTheWay => nextStatus == OrderStatus.Delivered,
            _ => false
        };

        if (!isValid)
        {
            throw new AppException($"Cannot change order status from {currentStatus} to {nextStatus}.");
        }
    }

    private static void EnsurePaymentAllowsOperationalProgress(Order order, Payment? payment)
    {
        if (order.PaymentMethod == PaymentMethod.Cash)
        {
            return;
        }

        if (order.PaymentMethod is not (PaymentMethod.Yape or PaymentMethod.Plin))
        {
            return;
        }

        if (payment?.Status == PaymentStatus.Paid)
        {
            return;
        }

        if (payment?.Status == PaymentStatus.PendingConfirmation || payment is null)
        {
            throw new AppException("El pago aún no ha sido confirmado.");
        }

        if (payment.Status is PaymentStatus.Rejected or PaymentStatus.Failed or PaymentStatus.Refunded)
        {
            throw new AppException("El pedido no puede continuar porque el pago no está disponible.");
        }
    }

    private static void CloseCashPaymentOnDelivery(Payment? payment, Guid actorUserId, DateTime deliveredAtUtc)
    {
        if (payment is null || payment.Method != PaymentMethod.Cash)
        {
            return;
        }

        if (payment.Status == PaymentStatus.Paid)
        {
            return;
        }

        payment.Status = PaymentStatus.Paid;
        payment.PaidAtUtc = deliveredAtUtc;
        payment.ConfirmedByUserId = actorUserId;
        payment.ConfirmedAtUtc = deliveredAtUtc;
    }

    private static Expression<Func<Order, DriverOrderDetailResponse>> MapDriverOrderDetail()
    {
        return x => new DriverOrderDetailResponse
        {
            Id = x.Id,
            RestaurantId = x.RestaurantId,
            RestaurantName = x.Restaurant.Name,
            RestaurantAddress = x.Restaurant.Address,
            CustomerId = x.CustomerId,
            CustomerName = x.Customer.User.FirstName + " " + x.Customer.User.LastName,
            CustomerPhone = x.Customer.User.Phone,
            ZoneId = x.ZoneId,
            ZoneName = x.Zone.Name,
            Status = x.Status.ToString(),
            DeliveryAddress = x.DeliveryAddress,
            DeliveryReference = x.DeliveryReference,
            Notes = x.Notes,
            PaymentMethod = x.PaymentMethod.ToString(),
            PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
            Subtotal = x.Subtotal,
            BusinessCommissionAmount = x.BusinessCommissionAmount,
            BusinessNetAmount = x.BusinessNetAmount,
            DeliveryFee = x.DeliveryFee,
            DeliveryPlatformCommissionAmount = x.DeliveryPlatformCommissionAmount,
            CourierEarningAmount = x.CourierEarningAmount,
            ServiceFeeAmount = x.ServiceFeeAmount,
            DiscountAmount = x.DiscountAmount,
            PlatformRevenueAmount = x.PlatformRevenueAmount,
            Total = x.Total,
            CreatedAtUtc = x.CreatedAtUtc,
            AcceptedAtUtc = x.AcceptedAtUtc,
            ReadyAtUtc = x.ReadyAtUtc,
            PickedUpAtUtc = x.PickedUpAtUtc,
            DeliveredAtUtc = x.DeliveredAtUtc,
            AssignedCourierUserId = x.AssignedCourierUserId,
            AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
            Items = x.Items
                .OrderBy(i => i.ProductName)
                .Select(i => new OrderItemDetailResponse
                {
                    ProductName = i.ProductName,
                    ImageUrl = i.MenuItem.ImageUrl,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Subtotal = i.Subtotal
                })
                .ToList()
        };
    }

    private async Task RegisterCompletedDeliveryAsync(DriverProfile driver, CancellationToken cancellationToken)
    {
        driver.CompletedDeliveriesCount += 1;
        await RefreshTrustMetricsAsync(driver, cancellationToken);
    }

    private async Task AssignCourierFinancialMovementsAsync(Guid orderId, Guid courierUserId, CancellationToken cancellationToken)
    {
        var movements = await _dbContext.FinancialMovements
            .Where(x => x.OrderId == orderId && x.Type == FinancialMovementType.CourierEarning)
            .ToListAsync(cancellationToken);

        foreach (var movement in movements)
        {
            movement.UserId = courierUserId;
        }
    }

    private async Task MarkOrderFinancialMovementsAvailableAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var availableAtUtc = DateTime.UtcNow;
        var movements = await _dbContext.FinancialMovements
            .Where(x => x.OrderId == orderId && x.Status == FinancialMovementStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var movement in movements)
        {
            movement.Status = FinancialMovementStatus.Available;
            movement.AvailableAtUtc = availableAtUtc;
        }
    }

    private async Task RefreshTrustMetricsAsync(DriverProfile driver, CancellationToken cancellationToken)
    {
        var averageRating = await _dbContext.Orders
            .Where(x => x.DriverId == driver.Id && x.Status == OrderStatus.Delivered && x.DriverRating.HasValue)
            .AverageAsync(x => (decimal?)x.DriverRating, cancellationToken);

        driver.TrustScore = DriverTrustCalculator.CalculateScore(driver.CompletedDeliveriesCount, averageRating);
        driver.TrustLevel = DriverTrustCalculator.CalculateLevel(driver.TrustScore);
    }

    private async Task NotifyBusinessAboutDriverAssignmentAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var notificationTarget = await _dbContext.Orders
            .Where(x => x.Id == orderId)
            .Select(x => new
            {
                x.Id,
                BusinessOwnerUserId = x.Restaurant.OwnerUserId,
                RestaurantName = x.Restaurant.Name
            })
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            notificationTarget.BusinessOwnerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pedido tomado por driver",
                Body = $"Un driver ya tomó el pedido #{notificationTarget.Id.ToString("N")[..8]} de {notificationTarget.RestaurantName}.",
                Data = NotificationPayloadFactory.BusinessOrder(notificationTarget.Id, $"/business/orders/{notificationTarget.Id}", "driver_assigned")
            },
            cancellationToken);
    }

    private async Task NotifyCustomerAboutDriverStatusAsync(Order order, OrderStatus nextStatus, CancellationToken cancellationToken)
    {
        if (nextStatus is not (OrderStatus.PickedUp or OrderStatus.OnTheWay or OrderStatus.Delivered))
        {
            return;
        }

        var customerUserId = await _dbContext.Customers
            .Where(x => x.Id == order.CustomerId)
            .Select(x => x.UserId)
            .FirstAsync(cancellationToken);

        var (title, body, eventName) = nextStatus switch
        {
            OrderStatus.PickedUp => (
                "Pedido recogido",
                "El driver ya recogió tu pedido.",
                "order_picked_up"),
            OrderStatus.OnTheWay => (
                "Pedido en camino",
                "Tu pedido ya está en camino.",
                "order_on_the_way"),
            OrderStatus.Delivered => (
                "Pedido entregado",
                "Tu pedido fue marcado como entregado.",
                "order_delivered"),
            _ => throw new InvalidOperationException("Unsupported order status for customer push.")
        };

        await _notificationService.SendToUserAsync(
            customerUserId,
            new EventPushNotificationRequest
            {
                Title = title,
                Body = body,
                Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", eventName)
            },
            cancellationToken);
    }
}
