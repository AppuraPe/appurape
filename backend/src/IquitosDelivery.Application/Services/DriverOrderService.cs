using System.Linq.Expressions;
using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Drivers;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class DriverOrderService : IDriverOrderService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<UpdateDriverOrderStatusRequest> _updateDriverOrderStatusValidator;

    public DriverOrderService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IValidator<UpdateDriverOrderStatusRequest> updateDriverOrderStatusValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
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
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant.Name,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                DeliveryAddress = x.DeliveryAddress,
                DeliveryReference = x.DeliveryReference,
                CourierEarningAmount = x.CourierEarningAmount,
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
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

    public async Task<DriverOrderDetailResponse> TakeOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var driver = await GetCurrentApprovedDriverAsync(cancellationToken);
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
            throw new AppException("Order has already been taken.");
        }

        if (order.Status != OrderStatus.ReadyForPickup)
        {
            throw new AppException("Order is not ready for pickup.");
        }

        order.DriverId = driver.Id;
        order.AssignedCourierUserId = driver.UserId;
        order.AssignedCourierType = CourierType.Driver;
        order.Status = OrderStatus.Assigned;
        driver.IsAvailable = false;
        await AssignCourierFinancialMovementsAsync(order.Id, driver.UserId, cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetMyOrderByIdAsync(order.Id, cancellationToken);
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
                RestaurantName = x.Restaurant.Name,
                Status = x.Status.ToString(),
                CourierEarningAmount = x.CourierEarningAmount,
                Total = x.Total,
                DeliveryAddress = x.DeliveryAddress,
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

        EnsureValidDriverTransition(order.Status, request.Status);

        order.Status = request.Status;

        if (request.Status == OrderStatus.PickedUp)
        {
            order.PickedUpAtUtc = DateTime.UtcNow;
        }

        if (request.Status == OrderStatus.Delivered)
        {
            order.DeliveredAtUtc = DateTime.UtcNow;
            driver.IsAvailable = true;
            await MarkOrderFinancialMovementsAvailableAsync(order.Id, cancellationToken);
            await RegisterCompletedDeliveryAsync(driver, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

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
                 (x.Status == OrderStatus.Assigned || x.Status == OrderStatus.PickedUp),
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
            OrderStatus.PickedUp => nextStatus == OrderStatus.Delivered,
            _ => false
        };

        if (!isValid)
        {
            throw new AppException($"Cannot change order status from {currentStatus} to {nextStatus}.");
        }
    }

    private static Expression<Func<Order, DriverOrderDetailResponse>> MapDriverOrderDetail()
    {
        return x => new DriverOrderDetailResponse
        {
            Id = x.Id,
            RestaurantId = x.RestaurantId,
            RestaurantName = x.Restaurant.Name,
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
}
