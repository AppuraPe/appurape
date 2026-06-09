using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class OrderService : IOrderService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<CreateOrderRequest> _createOrderValidator;
    private readonly IValidator<RateDriverRequest> _rateDriverValidator;
    private readonly IValidator<UpdateOrderStatusRequest> _updateOrderStatusValidator;

    public OrderService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IValidator<CreateOrderRequest> createOrderValidator,
        IValidator<RateDriverRequest> rateDriverValidator,
        IValidator<UpdateOrderStatusRequest> updateOrderStatusValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _createOrderValidator = createOrderValidator;
        _rateDriverValidator = rateDriverValidator;
        _updateOrderStatusValidator = updateOrderStatusValidator;
    }

    public async Task<CustomerOrderDetailResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        await _createOrderValidator.ValidateAndThrowAsync(request, cancellationToken);

        var customer = await GetCurrentCustomerAsync(cancellationToken);

        var restaurant = await _dbContext.Restaurants
            .FirstOrDefaultAsync(
                x => x.Id == request.RestaurantId &&
                     x.ApprovalStatus == ApprovalStatus.Approved &&
                     x.IsActive,
                cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("Restaurant is not available for orders.");
        }

        var zone = await _dbContext.Zones
            .FirstOrDefaultAsync(x => x.Id == request.ZoneId && x.IsActive, cancellationToken);

        if (zone is null)
        {
            throw new NotFoundException("Zone was not found.");
        }

        var requestedItemIds = request.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _dbContext.MenuItems
            .Where(x => requestedItemIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        if (menuItems.Count != requestedItemIds.Count)
        {
            throw new AppException("One or more products are invalid.");
        }

        foreach (var item in menuItems)
        {
            if (item.RestaurantId != restaurant.Id)
            {
                throw new AppException("One or more products do not belong to the selected restaurant.");
            }

            if (!item.IsActive || !item.IsAvailable)
            {
                throw new AppException($"Product '{item.Name}' is not available for ordering.");
            }
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            RestaurantId = restaurant.Id,
            ZoneId = zone.Id,
            Status = OrderStatus.Pending,
            PaymentMethod = request.PaymentMethod,
            DeliveryAddress = request.DeliveryAddress.Trim(),
            DeliveryReference = request.DeliveryReference.Trim(),
            Notes = NormalizeNotes(request.Notes)
        };

        foreach (var requestItem in request.Items)
        {
            var menuItem = menuItems.First(x => x.Id == requestItem.MenuItemId);

            if (menuItem.TrackStock)
            {
                var availableStock = menuItem.StockQuantity ?? 0;
                if (availableStock < requestItem.Quantity)
                {
                    throw new AppException($"Product '{menuItem.Name}' does not have enough stock.");
                }
            }

            var itemSubtotal = menuItem.Price * requestItem.Quantity;

            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                ProductName = menuItem.Name,
                UnitPrice = menuItem.Price,
                Quantity = requestItem.Quantity,
                Subtotal = itemSubtotal
            });

            if (menuItem.TrackStock)
            {
                menuItem.StockQuantity = (menuItem.StockQuantity ?? 0) - requestItem.Quantity;
                if (menuItem.StockQuantity <= 0)
                {
                    menuItem.StockQuantity = 0;
                    menuItem.IsAvailable = false;
                }
            }
        }

        order.Subtotal = order.Items.Sum(x => x.Subtotal);
        var commissionRules = await GetActiveCommissionRulesAsync(CommissionRuleScope.CommercialOrder, cancellationToken);
        var financialBreakdown = FinancialCalculator.CalculateCommercialOrder(order.Subtotal, zone.DeliveryFee, commissionRules);
        order.BusinessCommissionAmount = financialBreakdown.BusinessCommissionAmount;
        order.BusinessNetAmount = financialBreakdown.BusinessNetAmount;
        order.DeliveryFee = financialBreakdown.DeliveryFee;
        order.DeliveryPlatformCommissionAmount = financialBreakdown.DeliveryPlatformCommissionAmount;
        order.CourierEarningAmount = financialBreakdown.CourierEarningAmount;
        order.ServiceFeeAmount = financialBreakdown.ServiceFeeAmount;
        order.DiscountAmount = financialBreakdown.DiscountAmount;
        order.PlatformRevenueAmount = financialBreakdown.PlatformRevenueAmount;
        order.Total = financialBreakdown.Total;
        order.PricingSnapshotJson = FinancialCalculator.SerializeCommercialSnapshot(financialBreakdown, commissionRules);

        _dbContext.Add(order);
        CreateOrderFinancialMovements(order, restaurant.OwnerUserId);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetMyOrderByIdAsync(order.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<CustomerOrderListItemResponse>> GetMyOrdersAsync(CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);

        return await _dbContext.Orders
            .Where(x => x.CustomerId == customer.Id)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new CustomerOrderListItemResponse
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant.Name,
                Status = x.Status.ToString(),
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
                PaymentMethod = x.PaymentMethod.ToString(),
                AssignedCourierUserId = x.AssignedCourierUserId,
                AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerOrderDetailResponse> GetMyOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);

        var order = await _dbContext.Orders
            .Where(x => x.Id == orderId && x.CustomerId == customer.Id)
            .Select(x => new CustomerOrderDetailResponse
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant.Name,
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
                DriverRating = x.DriverRating,
                DriverFeedback = x.DriverFeedback,
                Items = x.Items
                    .OrderBy(i => i.ProductName)
                    .Select(i => new OrderItemDetailResponse
                    {
                        ProductName = i.ProductName,
                        ImageUrl = i.MenuItem.ImageUrl,
                        UnitPrice = i.UnitPrice,
                        Quantity = i.Quantity,
                        Subtotal = i.Subtotal
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        return order;
    }

    public async Task<CustomerOrderDetailResponse> RateDriverAsync(Guid orderId, RateDriverRequest request, CancellationToken cancellationToken = default)
    {
        await _rateDriverValidator.ValidateAndThrowAsync(request, cancellationToken);

        var customer = await GetCurrentCustomerAsync(cancellationToken);
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId && x.CustomerId == customer.Id, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (order.Status != OrderStatus.Delivered || order.DriverId is null)
        {
            throw new AppException("You can only rate a delivered order with a driver assigned.");
        }

        order.DriverRating = request.Rating;
        order.DriverFeedback = NormalizeNotes(request.Comment);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await RefreshDriverTrustMetricsAsync(order.DriverId.Value, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetMyOrderByIdAsync(order.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<RestaurantOrderListItemResponse>> GetRestaurantOrdersAsync(
        RestaurantOrderFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var orderId = Guid.TryParse(filters.Q?.Trim(), out var parsedOrderId) ? parsedOrderId : (Guid?)null;
        var query = _dbContext.Orders
            .Where(x => x.RestaurantId == restaurant.Id);

        if (filters.Status.HasValue)
        {
            query = query.Where(x => x.Status == filters.Status.Value);
        }

        if (searchTerm is not null)
        {
            query = query.Where(x =>
                (orderId.HasValue && x.Id == orderId.Value) ||
                (x.Customer.User.FirstName + " " + x.Customer.User.LastName).ToLower().Contains(searchTerm) ||
                x.Customer.User.Phone.ToLower().Contains(searchTerm) ||
                x.DeliveryAddress.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new RestaurantOrderListItemResponse
            {
                Id = x.Id,
                CustomerId = x.CustomerId,
                CustomerName = x.Customer.User.FirstName + " " + x.Customer.User.LastName,
                Status = x.Status.ToString(),
                BusinessNetAmount = x.BusinessNetAmount,
                PlatformRevenueAmount = x.PlatformRevenueAmount,
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
                AssignedCourierUserId = x.AssignedCourierUserId,
                AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RestaurantOrderDetailResponse> GetRestaurantOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        var order = await _dbContext.Orders
            .Where(x => x.Id == orderId && x.RestaurantId == restaurant.Id)
            .Select(x => new RestaurantOrderDetailResponse
            {
                Id = x.Id,
                CustomerId = x.CustomerId,
                CustomerName = x.Customer.User.FirstName + " " + x.Customer.User.LastName,
                CustomerPhone = x.Customer.User.Phone,
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
                        UnitPrice = i.UnitPrice,
                        Quantity = i.Quantity,
                        Subtotal = i.Subtotal
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        return order;
    }

    public async Task<RestaurantOrderDetailResponse> UpdateRestaurantOrderStatusAsync(Guid orderId, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default)
    {
        await _updateOrderStatusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId && x.RestaurantId == restaurant.Id, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        EnsureValidTransition(order.Status, request.Status);

        order.Status = request.Status;

        if (request.Status == OrderStatus.Accepted)
        {
            order.AcceptedAtUtc = DateTime.UtcNow;
        }

        if (request.Status == OrderStatus.ReadyForPickup)
        {
            order.ReadyAtUtc = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetRestaurantOrderByIdAsync(order.Id, cancellationToken);
    }

    private async Task<CustomerProfile> GetCurrentCustomerAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(x => x.UserId == _currentUserService.UserId.Value, cancellationToken);

        if (customer is null)
        {
            throw new AppException("Authenticated user does not have a customer profile.");
        }

        return customer;
    }

    private async Task<Restaurant> GetCurrentRestaurantAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var restaurant = await _dbContext.Restaurants
            .FirstOrDefaultAsync(x => x.OwnerUserId == _currentUserService.UserId.Value, cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("No restaurant is associated with the authenticated user.");
        }

        return restaurant;
    }

    private static void EnsureValidTransition(OrderStatus currentStatus, OrderStatus nextStatus)
    {
        var isValid = currentStatus switch
        {
            OrderStatus.Pending => nextStatus is OrderStatus.Accepted or OrderStatus.Cancelled,
            OrderStatus.Accepted => nextStatus is OrderStatus.Preparing or OrderStatus.Cancelled,
            OrderStatus.Preparing => nextStatus is OrderStatus.ReadyForPickup or OrderStatus.Cancelled,
            _ => false
        };

        if (!isValid)
        {
            throw new AppException($"Cannot change order status from {currentStatus} to {nextStatus}.");
        }
    }

    private static string? NormalizeNotes(string? notes)
    {
        return string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    private async Task<List<CommissionRule>> GetActiveCommissionRulesAsync(CommissionRuleScope scope, CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;

        return await _dbContext.CommissionRules
            .Where(x =>
                x.Scope == scope &&
                x.IsEnabled &&
                (!x.EffectiveFromUtc.HasValue || x.EffectiveFromUtc.Value <= utcNow) &&
                (!x.EffectiveToUtc.HasValue || x.EffectiveToUtc.Value >= utcNow))
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Code)
            .ToListAsync(cancellationToken);
    }

    private void CreateOrderFinancialMovements(Order order, Guid restaurantOwnerUserId)
    {
        var occurredAtUtc = DateTime.UtcNow;
        var orderReference = $"ORDER-{order.Id:N}";

        AddOrderMovement(order, restaurantOwnerUserId, FinancialMovementType.BusinessNetAmount, order.BusinessNetAmount, "Net amount payable to the business for the order.", occurredAtUtc, orderReference);
        AddOrderMovement(order, null, FinancialMovementType.BusinessCommission, order.BusinessCommissionAmount, "Platform commission charged on the business sale.", occurredAtUtc, orderReference);
        AddOrderMovement(order, null, FinancialMovementType.DeliveryPlatformCommission, order.DeliveryPlatformCommissionAmount, "Platform commission retained from the delivery fee.", occurredAtUtc, orderReference);
        AddOrderMovement(order, null, FinancialMovementType.CourierEarning, order.CourierEarningAmount, "Courier earning reserved for the delivery.", occurredAtUtc, orderReference);
        AddOrderMovement(order, null, FinancialMovementType.ServiceFee, order.ServiceFeeAmount, "Service fee charged to the customer.", occurredAtUtc, orderReference);
    }

    private void AddOrderMovement(
        Order order,
        Guid? userId,
        FinancialMovementType type,
        decimal amount,
        string description,
        DateTime occurredAtUtc,
        string orderReference)
    {
        if (amount <= 0m)
        {
            return;
        }

        _dbContext.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            RestaurantId = order.RestaurantId,
            UserId = userId,
            Type = type,
            Status = FinancialMovementStatus.Pending,
            Amount = amount,
            OccurredAtUtc = occurredAtUtc,
            Reference = orderReference,
            Description = description
        });
    }

    private async Task RefreshDriverTrustMetricsAsync(Guid driverId, CancellationToken cancellationToken)
    {
        var driver = await _dbContext.Drivers.FirstOrDefaultAsync(x => x.Id == driverId, cancellationToken);

        if (driver is null)
        {
            throw new NotFoundException("Driver was not found.");
        }

        var averageRating = await _dbContext.Orders
            .Where(x => x.DriverId == driverId && x.Status == OrderStatus.Delivered && x.DriverRating.HasValue)
            .AverageAsync(x => (decimal?)x.DriverRating, cancellationToken);

        driver.TrustScore = DriverTrustCalculator.CalculateScore(driver.CompletedDeliveriesCount, averageRating);
        driver.TrustLevel = DriverTrustCalculator.CalculateLevel(driver.TrustScore);
    }
}
