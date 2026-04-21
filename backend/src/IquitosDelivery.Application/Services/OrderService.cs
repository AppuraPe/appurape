using FluentValidation;
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
    private readonly IValidator<UpdateOrderStatusRequest> _updateOrderStatusValidator;

    public OrderService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IValidator<CreateOrderRequest> createOrderValidator,
        IValidator<UpdateOrderStatusRequest> updateOrderStatusValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _createOrderValidator = createOrderValidator;
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
        }

        order.Subtotal = order.Items.Sum(x => x.Subtotal);
        order.DeliveryFee = zone.DeliveryFee;
        order.Total = order.Subtotal + order.DeliveryFee;

        _dbContext.Add(order);
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
                DeliveryFee = x.DeliveryFee,
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
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
                DeliveryFee = x.DeliveryFee,
                Total = x.Total,
                CreatedAtUtc = x.CreatedAtUtc,
                AcceptedAtUtc = x.AcceptedAtUtc,
                ReadyAtUtc = x.ReadyAtUtc,
                PickedUpAtUtc = x.PickedUpAtUtc,
                DeliveredAtUtc = x.DeliveredAtUtc,
                Items = x.Items
                    .OrderBy(i => i.ProductName)
                    .Select(i => new OrderItemDetailResponse
                    {
                        ProductName = i.ProductName,
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

    public async Task<IReadOnlyList<RestaurantOrderListItemResponse>> GetRestaurantOrdersAsync(CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        return await _dbContext.Orders
            .Where(x => x.RestaurantId == restaurant.Id)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new RestaurantOrderListItemResponse
            {
                Id = x.Id,
                CustomerId = x.CustomerId,
                CustomerName = x.Customer.User.FirstName + " " + x.Customer.User.LastName,
                Status = x.Status.ToString(),
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
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
                DeliveryFee = x.DeliveryFee,
                Total = x.Total,
                CreatedAtUtc = x.CreatedAtUtc,
                AcceptedAtUtc = x.AcceptedAtUtc,
                ReadyAtUtc = x.ReadyAtUtc,
                PickedUpAtUtc = x.PickedUpAtUtc,
                DeliveredAtUtc = x.DeliveredAtUtc,
                Items = x.Items
                    .OrderBy(i => i.ProductName)
                    .Select(i => new OrderItemDetailResponse
                    {
                        ProductName = i.ProductName,
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
}
