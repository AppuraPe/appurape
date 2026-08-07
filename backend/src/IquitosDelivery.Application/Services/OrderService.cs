using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace IquitosDelivery.Application.Services;

public class OrderService : IOrderService
{
    private enum OrderCancellationActor
    {
        Customer,
        Restaurant,
        Admin
    }

    private sealed class ResolvedDeliveryAddress
    {
        public required Zone Zone { get; init; }

        public required string DeliveryAddress { get; init; }

        public required string DeliveryReference { get; init; }

        public Guid? CustomerAddressId { get; init; }
    }

    private sealed class ValidatedOrderLine
    {
        public required MenuItem MenuItem { get; init; }

        public required int Quantity { get; init; }

        public required decimal UnitPrice { get; init; }
    }

    private sealed class ValidatedOrderContext
    {
        public required Restaurant Restaurant { get; init; }

        public required Zone Zone { get; init; }

        public Guid? CustomerAddressId { get; init; }

        public required string DeliveryAddress { get; init; }

        public required string DeliveryReference { get; init; }

        public required List<ValidatedOrderLine> ValidLines { get; init; }

        public required ValidateOrderResponse Response { get; init; }
    }

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly IValidator<CreateOrderRequest> _createOrderValidator;
    private readonly IValidator<ConfirmRestaurantOrderPaymentRequest> _confirmRestaurantOrderPaymentValidator;
    private readonly IValidator<RateDriverRequest> _rateDriverValidator;
    private readonly IValidator<RejectRestaurantOrderPaymentRequest> _rejectRestaurantOrderPaymentValidator;
    private readonly IValidator<UpdateOrderStatusRequest> _updateOrderStatusValidator;

    public OrderService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IValidator<CreateOrderRequest> createOrderValidator,
        IValidator<ConfirmRestaurantOrderPaymentRequest> confirmRestaurantOrderPaymentValidator,
        IValidator<RateDriverRequest> rateDriverValidator,
        IValidator<RejectRestaurantOrderPaymentRequest> rejectRestaurantOrderPaymentValidator,
        IValidator<UpdateOrderStatusRequest> updateOrderStatusValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _createOrderValidator = createOrderValidator;
        _confirmRestaurantOrderPaymentValidator = confirmRestaurantOrderPaymentValidator;
        _rateDriverValidator = rateDriverValidator;
        _rejectRestaurantOrderPaymentValidator = rejectRestaurantOrderPaymentValidator;
        _updateOrderStatusValidator = updateOrderStatusValidator;
    }

    public async Task<ValidateOrderResponse> ValidateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        var validationContext = await ValidateOrderContextAsync(request, cancellationToken);
        return validationContext.Response;
    }

    public async Task<CustomerOrderDetailResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);
        var normalizedClientRequestId = request.ClientRequestId.Trim();

        if (await TryGetExistingOrderAsync(customer.Id, normalizedClientRequestId, cancellationToken) is { } existingOrder)
        {
            return existingOrder;
        }

        if (_dbContext is not DbContext dbContext)
        {
            throw new InvalidOperationException("Order transactions require a DbContext-backed implementation.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        try
        {
            if (await TryGetExistingOrderAsync(customer.Id, normalizedClientRequestId, cancellationToken) is { } transactionalExistingOrder)
            {
                await transaction.CommitAsync(cancellationToken);
                return transactionalExistingOrder;
            }

            var validationContext = await ValidateOrderContextAsync(request, cancellationToken);

            if (!validationContext.Response.CanCreateOrder)
            {
                var firstIssue = validationContext.Response.Items.FirstOrDefault(x => x.Removed || x.QuantityAdjusted || x.PriceChanged)
                    ?.Message;

                throw new AppException(firstIssue ?? "Your cart changed and must be reviewed before placing the order.");
            }

            var order = new Order
            {
                Id = Guid.NewGuid(),
                ClientRequestId = normalizedClientRequestId,
                CustomerId = customer.Id,
                RestaurantId = validationContext.Restaurant.Id,
                ZoneId = validationContext.Zone.Id,
                Status = OrderStatus.Pending,
                PaymentMethod = request.PaymentMethod,
                DeliveryAddress = validationContext.DeliveryAddress,
                DeliveryReference = validationContext.DeliveryReference,
                Notes = NormalizeNotes(request.Notes)
            };

            foreach (var validatedLine in validationContext.ValidLines)
            {
                var menuItem = validatedLine.MenuItem;

                if (menuItem.TrackStock)
                {
                    var availableStock = menuItem.StockQuantity ?? 0;
                    if (availableStock < validatedLine.Quantity)
                    {
                        throw new AppException($"Product '{menuItem.Name}' does not have enough stock.");
                    }
                }

                var itemSubtotal = validatedLine.UnitPrice * validatedLine.Quantity;

                order.Items.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    MenuItemId = menuItem.Id,
                    ProductName = menuItem.Name,
                    UnitPrice = validatedLine.UnitPrice,
                    Quantity = validatedLine.Quantity,
                    Subtotal = itemSubtotal
                });

                if (menuItem.TrackStock)
                {
                    menuItem.StockQuantity = (menuItem.StockQuantity ?? 0) - validatedLine.Quantity;
                    if (menuItem.StockQuantity <= 0)
                    {
                        menuItem.StockQuantity = 0;
                        menuItem.IsAvailable = false;
                    }
                }
            }

            order.Subtotal = order.Items.Sum(x => x.Subtotal);
            var commissionRules = await GetActiveCommissionRulesAsync(CommissionRuleScope.CommercialOrder, cancellationToken);
            var financialBreakdown = FinancialCalculator.CalculateCommercialOrder(
                order.Subtotal,
                request.DeliveryMode,
                request.OfferedDeliveryAmount,
                validationContext.Restaurant.HasOwnDelivery,
                validationContext.Restaurant.OwnDeliveryFee,
                commissionRules);
            order.BusinessCommissionAmount = financialBreakdown.BusinessCommissionAmount;
            order.BusinessNetAmount = financialBreakdown.BusinessNetAmount;
            order.DeliveryMode = financialBreakdown.DeliveryMode;
            order.DeliveryFee = financialBreakdown.DeliveryFee;
            order.DeliveryMinimumAmount = financialBreakdown.DeliveryMinimumAmount;
            order.DeliveryPlatformCommissionAmount = financialBreakdown.DeliveryPlatformCommissionAmount;
            order.CourierEarningAmount = financialBreakdown.CourierEarningAmount;
            order.ServiceFeeAmount = financialBreakdown.ServiceFeeAmount;
            order.DiscountAmount = financialBreakdown.DiscountAmount;
            order.PlatformRevenueAmount = financialBreakdown.PlatformRevenueAmount;
            order.Total = financialBreakdown.Total;
            order.PricingSnapshotJson = FinancialCalculator.SerializeCommercialSnapshot(financialBreakdown, commissionRules);
            order.Payment = BuildInitialPayment(order);

            _dbContext.Add(order);
            CreateOrderFinancialMovements(order, validationContext.Restaurant.OwnerUserId);
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await NotifyBusinessAboutNewOrderAsync(order, validationContext.Restaurant.OwnerUserId, cancellationToken);

            return await GetMyOrderByIdAsync(order.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
            if (await TryGetExistingOrderAsync(customer.Id, normalizedClientRequestId, cancellationToken) is { } idempotentOrder)
            {
                return idempotentOrder;
            }

            if (IsConcurrentOrderCreationFailure(ex))
            {
                throw new AppException("Some products changed while we were creating your order. Review your cart and try again.");
            }

            throw;
        }
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
                DeliveryMode = x.DeliveryMode.ToString(),
                DeliveryFee = x.DeliveryFee,
                DeliveryMinimumAmount = x.DeliveryMinimumAmount,
                DeliveryPlatformCommissionAmount = x.DeliveryPlatformCommissionAmount,
                CourierEarningAmount = x.CourierEarningAmount,
                ServiceFeeAmount = x.ServiceFeeAmount,
                DiscountAmount = x.DiscountAmount,
                PlatformRevenueAmount = x.PlatformRevenueAmount,
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
                PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
                AssignedCourierUserId = x.AssignedCourierUserId,
                AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerOrderDetailResponse> GetMyOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);

        return await GetCustomerOrderDetailByIdAsync(orderId, customer.Id, cancellationToken);
    }

    public async Task<CustomerOrderDetailResponse> CancelMyOrderAsync(
        Guid orderId,
        CancelOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);
        var order = await CancelCommercialOrderAsync(
            orderId,
            request,
            OrderCancellationActor.Customer,
            customer.Id,
            restaurantId: null,
            cancellationToken);

        await NotifyBusinessAboutCustomerCancellationAsync(order, cancellationToken);
        return await GetCustomerOrderDetailByIdAsync(order.Id, customer.Id, cancellationToken);
    }

    public async Task<CustomerOrderDetailResponse> CancelAdminOrderAsync(
        Guid orderId,
        CancelOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var order = await CancelCommercialOrderAsync(
            orderId,
            request,
            OrderCancellationActor.Admin,
            customerId: null,
            restaurantId: null,
            cancellationToken);

        await NotifyCustomerAboutAdminCancellationAsync(order, cancellationToken);
        return await GetCustomerOrderDetailByIdAsync(order.Id, customerId: null, cancellationToken);
    }

    private async Task<CustomerOrderDetailResponse> GetCustomerOrderDetailByIdAsync(
        Guid orderId,
        Guid? customerId,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Orders.Where(x => x.Id == orderId);
        if (customerId.HasValue)
        {
            query = query.Where(x => x.CustomerId == customerId.Value);
        }

        var order = await query
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
                PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
                Subtotal = x.Subtotal,
                BusinessCommissionAmount = x.BusinessCommissionAmount,
                BusinessNetAmount = x.BusinessNetAmount,
                DeliveryMode = x.DeliveryMode.ToString(),
                DeliveryFee = x.DeliveryFee,
                DeliveryMinimumAmount = x.DeliveryMinimumAmount,
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

    private async Task<ValidatedOrderContext> ValidateOrderContextAsync(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        await _createOrderValidator.ValidateAndThrowAsync(request, cancellationToken);
        var customer = await GetCurrentCustomerAsync(cancellationToken);

        if (request.PaymentMethod == PaymentMethod.Card)
        {
            throw new AppException("Los pagos con tarjeta todavía no están disponibles.");
        }

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

        EnsureDeliveryModeCanBeRequested(restaurant, request);

        var resolvedDeliveryAddress = await ResolveDeliveryAddressAsync(customer.Id, request, cancellationToken);

        var normalizedItems = request.Items
            .GroupBy(x => x.MenuItemId)
            .Select(group => new CreateOrderItemRequest
            {
                MenuItemId = group.Key,
                Quantity = group.Sum(x => x.Quantity),
                ClientUnitPrice = group.Select(x => x.ClientUnitPrice).FirstOrDefault(x => x.HasValue)
            })
            .ToList();

        var requestedItemIds = normalizedItems.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _dbContext.MenuItems
            .Where(x => requestedItemIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var response = new ValidateOrderResponse();
        var validLines = new List<ValidatedOrderLine>();

        foreach (var requestedItem in normalizedItems)
        {
            if (!menuItems.TryGetValue(requestedItem.MenuItemId, out var menuItem))
            {
                response.HasChanges = true;
                response.Items.Add(new ValidateOrderItemResponse
                {
                    MenuItemId = requestedItem.MenuItemId,
                    ProductName = "Producto no disponible",
                    RequestedQuantity = requestedItem.Quantity,
                    ValidatedQuantity = 0,
                    ClientUnitPrice = requestedItem.ClientUnitPrice,
                    CurrentUnitPrice = 0m,
                    Subtotal = 0m,
                    Exists = false,
                    BelongsToRestaurant = false,
                    IsActive = false,
                    IsAvailable = false,
                    HasStock = false,
                    QuantityAdjusted = false,
                    PriceChanged = false,
                    Removed = true,
                    Message = "El producto ya no está disponible."
                });
                continue;
            }

            var belongsToRestaurant = menuItem.RestaurantId == restaurant.Id;
            var isActive = menuItem.IsActive;
            var isAvailable = menuItem.IsAvailable;
            var hasStock = !menuItem.TrackStock || (menuItem.StockQuantity ?? 0) > 0;
            var requestedQuantity = requestedItem.Quantity;
            var validatedQuantity = requestedQuantity;

            if (!belongsToRestaurant)
            {
                response.HasChanges = true;
                response.Items.Add(BuildInvalidItemResponse(
                    menuItem,
                    requestedItem,
                    belongsToRestaurant,
                    isActive,
                    isAvailable,
                    hasStock,
                    "El producto no pertenece a este negocio."));
                continue;
            }

            if (!isActive || !isAvailable)
            {
                response.HasChanges = true;
                response.Items.Add(BuildInvalidItemResponse(
                    menuItem,
                    requestedItem,
                    belongsToRestaurant,
                    isActive,
                    isAvailable,
                    hasStock,
                    "El producto ya no está disponible."));
                continue;
            }

            if (menuItem.TrackStock)
            {
                var availableStock = Math.Max(0, menuItem.StockQuantity ?? 0);

                if (availableStock <= 0)
                {
                    response.HasChanges = true;
                    response.Items.Add(BuildInvalidItemResponse(
                        menuItem,
                        requestedItem,
                        belongsToRestaurant,
                        isActive,
                        isAvailable,
                        false,
                        "El producto se quedó sin stock."));
                    continue;
                }

                if (availableStock < requestedQuantity)
                {
                    validatedQuantity = availableStock;
                    response.HasChanges = true;
                }
            }

            var priceChanged = requestedItem.ClientUnitPrice.HasValue && requestedItem.ClientUnitPrice.Value != menuItem.Price;
            if (priceChanged)
            {
                response.HasChanges = true;
            }

            var quantityAdjusted = validatedQuantity != requestedQuantity;
            var subtotal = menuItem.Price * validatedQuantity;

            response.Items.Add(new ValidateOrderItemResponse
            {
                MenuItemId = menuItem.Id,
                ProductName = menuItem.Name,
                RequestedQuantity = requestedQuantity,
                ValidatedQuantity = validatedQuantity,
                ClientUnitPrice = requestedItem.ClientUnitPrice,
                CurrentUnitPrice = menuItem.Price,
                Subtotal = subtotal,
                Exists = true,
                BelongsToRestaurant = true,
                IsActive = isActive,
                IsAvailable = isAvailable,
                HasStock = true,
                QuantityAdjusted = quantityAdjusted,
                PriceChanged = priceChanged,
                Removed = false,
                Message = BuildValidatedItemMessage(menuItem.Name, quantityAdjusted, validatedQuantity, priceChanged)
            });

            validLines.Add(new ValidatedOrderLine
            {
                MenuItem = menuItem,
                Quantity = validatedQuantity,
                UnitPrice = menuItem.Price
            });
        }

        response.Subtotal = validLines.Sum(x => x.UnitPrice * x.Quantity);
        var commissionRules = await GetActiveCommissionRulesAsync(CommissionRuleScope.CommercialOrder, cancellationToken);
        var financialBreakdown = FinancialCalculator.CalculateCommercialOrder(
            response.Subtotal,
            request.DeliveryMode,
            request.OfferedDeliveryAmount,
            restaurant.HasOwnDelivery,
            restaurant.OwnDeliveryFee,
            commissionRules);
        if (request.DeliveryMode == DeliveryMode.VerifiedDriverDelivery &&
            request.OfferedDeliveryAmount.HasValue &&
            request.OfferedDeliveryAmount.Value < financialBreakdown.DeliveryMinimumAmount)
        {
            throw new AppException($"La entrega con driver verificado debe ser como mínimo S/ {financialBreakdown.DeliveryMinimumAmount:0.00}.");
        }

        response.BusinessCommissionAmount = financialBreakdown.BusinessCommissionAmount;
        response.BusinessNetAmount = financialBreakdown.BusinessNetAmount;
        response.DeliveryMode = financialBreakdown.DeliveryMode.ToString();
        response.DeliveryFee = financialBreakdown.DeliveryFee;
        response.DeliveryMinimumAmount = financialBreakdown.DeliveryMinimumAmount;
        response.DeliveryPlatformCommissionAmount = financialBreakdown.DeliveryPlatformCommissionAmount;
        response.CourierEarningAmount = financialBreakdown.CourierEarningAmount;
        response.ServiceFeeAmount = financialBreakdown.ServiceFeeAmount;
        response.DiscountAmount = financialBreakdown.DiscountAmount;
        response.PlatformRevenueAmount = financialBreakdown.PlatformRevenueAmount;
        response.Total = financialBreakdown.Total;
        response.CanCreateOrder = validLines.Count > 0 && response.Items.All(x => !x.QuantityAdjusted && !x.Removed && !x.PriceChanged);

        return new ValidatedOrderContext
        {
            Restaurant = restaurant,
            Zone = resolvedDeliveryAddress.Zone,
            CustomerAddressId = resolvedDeliveryAddress.CustomerAddressId,
            DeliveryAddress = resolvedDeliveryAddress.DeliveryAddress,
            DeliveryReference = resolvedDeliveryAddress.DeliveryReference,
            ValidLines = validLines,
            Response = response
        };
    }

    private async Task<ResolvedDeliveryAddress> ResolveDeliveryAddressAsync(
        Guid customerId,
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CustomerAddressId.HasValue)
        {
            var customerAddress = await _dbContext.CustomerAddresses
                .AsNoTracking()
                .Include(x => x.Zone)
                .FirstOrDefaultAsync(
                    x => x.Id == request.CustomerAddressId.Value &&
                         x.CustomerProfileId == customerId &&
                         x.IsActive,
                    cancellationToken);

            if (customerAddress is null)
            {
                throw new NotFoundException("Customer address was not found.");
            }

            if (!customerAddress.Zone.IsActive)
            {
                throw new NotFoundException("Zone was not found.");
            }

            return new ResolvedDeliveryAddress
            {
                Zone = customerAddress.Zone,
                CustomerAddressId = customerAddress.Id,
                DeliveryAddress = customerAddress.AddressLine,
                DeliveryReference = customerAddress.Reference
            };
        }

        var zone = await _dbContext.Zones
            .FirstOrDefaultAsync(x => x.Id == request.ZoneId && x.IsActive, cancellationToken);

        if (zone is null)
        {
            throw new NotFoundException("Zone was not found.");
        }

        return new ResolvedDeliveryAddress
        {
            Zone = zone,
            CustomerAddressId = null,
            DeliveryAddress = request.DeliveryAddress.Trim(),
            DeliveryReference = request.DeliveryReference.Trim()
        };
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
                ItemCount = x.Items.Sum(i => i.Quantity),
                Status = x.Status.ToString(),
                BusinessNetAmount = x.BusinessNetAmount,
                DeliveryMode = x.DeliveryMode.ToString(),
                DeliveryFee = x.DeliveryFee,
                DeliveryMinimumAmount = x.DeliveryMinimumAmount,
                PlatformRevenueAmount = x.PlatformRevenueAmount,
                Total = x.Total,
                PaymentMethod = x.PaymentMethod.ToString(),
                PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
                AssignedCourierUserId = x.AssignedCourierUserId,
                AssignedCourierType = x.AssignedCourierType.HasValue ? x.AssignedCourierType.Value.ToString() : null,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RestaurantOrderPaymentResponse> GetRestaurantOrderPaymentAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var (_, payment) = await GetRestaurantOrderPaymentEntityAsync(orderId, cancellationToken);
        return MapRestaurantOrderPayment(payment);
    }

    public async Task<RestaurantOrderPaymentResponse> ConfirmRestaurantOrderPaymentAsync(
        Guid orderId,
        ConfirmRestaurantOrderPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        await _confirmRestaurantOrderPaymentValidator.ValidateAndThrowAsync(request, cancellationToken);

        var (_, payment) = await GetRestaurantOrderPaymentEntityAsync(orderId, cancellationToken);
        EnsureManualBusinessPayment(payment);

        if (payment.Status == PaymentStatus.Paid)
        {
            return MapRestaurantOrderPayment(payment);
        }

        if (payment.Status == PaymentStatus.Rejected)
        {
            throw new AppException("Este pago ya fue rechazado y no se puede confirmar.");
        }

        if (payment.Status != PaymentStatus.PendingConfirmation)
        {
            throw new AppException("Este pago no se puede confirmar en su estado actual.");
        }

        var confirmedAtUtc = DateTime.UtcNow;
        payment.Status = PaymentStatus.Paid;
        payment.ConfirmedByUserId = _currentUserService.UserId;
        payment.ConfirmedAtUtc = confirmedAtUtc;
        payment.PaidAtUtc = confirmedAtUtc;
        payment.ManualReference = NormalizeOptionalValue(request.ManualReference);
        payment.RejectedAtUtc = null;
        payment.FailureReason = null;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyCustomerAboutPaymentStatusAsync(payment, "Pago confirmado", "Tu pago fue confirmado y el negocio ya puede continuar con tu pedido.", cancellationToken);
        return MapRestaurantOrderPayment(payment);
    }

    public async Task<RestaurantOrderPaymentResponse> RejectRestaurantOrderPaymentAsync(
        Guid orderId,
        RejectRestaurantOrderPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        await _rejectRestaurantOrderPaymentValidator.ValidateAndThrowAsync(request, cancellationToken);

        var (_, payment) = await GetRestaurantOrderPaymentEntityAsync(orderId, cancellationToken);
        EnsureManualBusinessPayment(payment);

        if (payment.Status == PaymentStatus.Rejected)
        {
            return MapRestaurantOrderPayment(payment);
        }

        if (payment.Status == PaymentStatus.Paid)
        {
            throw new AppException("Este pago ya fue confirmado y no se puede rechazar.");
        }

        if (payment.Status != PaymentStatus.PendingConfirmation)
        {
            throw new AppException("Este pago no se puede rechazar en su estado actual.");
        }

        payment.Status = PaymentStatus.Rejected;
        payment.ConfirmedByUserId = _currentUserService.UserId;
        payment.RejectedAtUtc = DateTime.UtcNow;
        payment.FailureReason = request.FailureReason.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyCustomerAboutPaymentStatusAsync(payment, "Pago rechazado", "Tu pago fue rechazado. Revisa el motivo en el detalle del pedido.", cancellationToken);
        return MapRestaurantOrderPayment(payment);
    }

    public async Task<RestaurantOrderDetailResponse> GetRestaurantOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        var orderOwner = await _dbContext.Orders
            .AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.RestaurantId
            })
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (orderOwner is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (orderOwner.RestaurantId != restaurant.Id)
        {
            throw new ForbiddenException("You do not have access to this order.");
        }

        var order = await _dbContext.Orders
            .Where(x => x.Id == orderId)
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
                PaymentStatus = x.Payment != null ? x.Payment.Status.ToString() : string.Empty,
                Subtotal = x.Subtotal,
                BusinessCommissionAmount = x.BusinessCommissionAmount,
                BusinessNetAmount = x.BusinessNetAmount,
                DeliveryMode = x.DeliveryMode.ToString(),
                DeliveryFee = x.DeliveryFee,
                DeliveryMinimumAmount = x.DeliveryMinimumAmount,
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

        if (request.Status == OrderStatus.Cancelled)
        {
            return await CancelRestaurantOrderAsync(orderId, new CancelOrderRequest(), cancellationToken);
        }

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (order.RestaurantId != restaurant.Id)
        {
            throw new ForbiddenException("You do not have access to this order.");
        }

        var payment = await _dbContext.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken);

        EnsurePaymentAllowsOperationalProgress(order, payment, request.Status);
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
        await NotifyRestaurantOrderStatusChangedAsync(order, restaurant, request.Status, cancellationToken);

        return await GetRestaurantOrderByIdAsync(order.Id, cancellationToken);
    }

    public async Task<RestaurantOrderDetailResponse> CancelRestaurantOrderAsync(
        Guid orderId,
        CancelOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var order = await CancelCommercialOrderAsync(
            orderId,
            request,
            OrderCancellationActor.Restaurant,
            customerId: null,
            restaurant.Id,
            cancellationToken);

        await NotifyCustomerAboutRestaurantCancellationAsync(order, restaurant.Name, cancellationToken);
        return await GetRestaurantOrderByIdAsync(order.Id, cancellationToken);
    }

    private async Task<Order> CancelCommercialOrderAsync(
        Guid orderId,
        CancelOrderRequest request,
        OrderCancellationActor actor,
        Guid? customerId,
        Guid? restaurantId,
        CancellationToken cancellationToken)
    {
        if (_dbContext is not DbContext dbContext)
        {
            throw new InvalidOperationException("Order cancellations require a DbContext-backed implementation.");
        }

        var useTransaction = dbContext.Database.IsRelational();
        await using var transaction = useTransaction
            ? await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            : null;

        try
        {
            var order = await _dbContext.Orders
                .Include(x => x.Items)
                    .ThenInclude(x => x.MenuItem)
                .Include(x => x.Payment)
                .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

            if (order is null)
            {
                throw new NotFoundException("Order was not found.");
            }

            EnsureCancellationActorCanAccessOrder(order, actor, customerId, restaurantId);
            EnsureOrderCanBeCancelled(order, actor);

            order.Status = OrderStatus.Cancelled;
            RestoreTrackedStock(order);
            UpdatePaymentForCancelledOrder(order.Payment, request.Reason);
            await CancelPendingFinancialMovementsAsync(order.Id, cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return order;
        }
        catch
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }

            throw;
        }
    }

    private static void EnsureCancellationActorCanAccessOrder(
        Order order,
        OrderCancellationActor actor,
        Guid? customerId,
        Guid? restaurantId)
    {
        if (actor == OrderCancellationActor.Customer && order.CustomerId != customerId)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (actor == OrderCancellationActor.Restaurant && order.RestaurantId != restaurantId)
        {
            throw new ForbiddenException("You do not have access to this order.");
        }
    }

    private static void EnsureOrderCanBeCancelled(Order order, OrderCancellationActor actor)
    {
        if (order.Status == OrderStatus.Cancelled)
        {
            throw new AppException("El pedido ya fue cancelado.");
        }

        var canCancel = actor switch
        {
            OrderCancellationActor.Customer => order.Status == OrderStatus.Pending,
            OrderCancellationActor.Restaurant => order.Status is OrderStatus.Pending or OrderStatus.Accepted or OrderStatus.Preparing,
            OrderCancellationActor.Admin => order.Status is OrderStatus.Pending or OrderStatus.Accepted or OrderStatus.Preparing ||
                (order.Status == OrderStatus.ReadyForPickup && order.AssignedCourierUserId is null),
            _ => false
        };

        if (!canCancel)
        {
            throw new AppException("El pedido ya no puede ser cancelado.");
        }
    }

    private static void RestoreTrackedStock(Order order)
    {
        foreach (var item in order.Items)
        {
            var menuItem = item.MenuItem;
            if (!menuItem.TrackStock)
            {
                continue;
            }

            menuItem.StockQuantity = (menuItem.StockQuantity ?? 0) + item.Quantity;
            if (menuItem.IsActive && menuItem.StockQuantity > 0)
            {
                menuItem.IsAvailable = true;
            }
        }
    }

    private static void UpdatePaymentForCancelledOrder(Payment? payment, string? reason)
    {
        if (payment is null)
        {
            return;
        }

        var cancellationReason = NormalizeCancellationReason(reason);

        if (payment.Status is PaymentStatus.Pending or PaymentStatus.PendingConfirmation)
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = cancellationReason;
            return;
        }

        if (payment.Status == PaymentStatus.Paid)
        {
            payment.Status = PaymentStatus.Refunded;
            payment.FailureReason = cancellationReason;
        }
    }

    private async Task CancelPendingFinancialMovementsAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var movements = await _dbContext.FinancialMovements
            .Where(x => x.OrderId == orderId && x.Status == FinancialMovementStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var movement in movements)
        {
            movement.Status = FinancialMovementStatus.Cancelled;
        }
    }

    private static string NormalizeCancellationReason(string? reason)
    {
        return string.IsNullOrWhiteSpace(reason)
            ? "Pedido cancelado."
            : reason.Trim();
    }

    private async Task<(Order order, Payment payment)> GetRestaurantOrderPaymentEntityAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        var order = await _dbContext.Orders
            .AsNoTracking()
            .Select(x => new Order
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId
            })
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (order.RestaurantId != restaurant.Id)
        {
            throw new ForbiddenException("You do not have access to this order payment.");
        }

        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);

        if (payment is null)
        {
            throw new NotFoundException("Payment was not found for this order.");
        }

        return (order, payment);
    }

    private static RestaurantOrderPaymentResponse MapRestaurantOrderPayment(Payment payment)
    {
        return new RestaurantOrderPaymentResponse
        {
            OrderId = payment.OrderId,
            PaymentId = payment.Id,
            Method = payment.Method.ToString(),
            Status = payment.Status.ToString(),
            Amount = payment.Amount,
            Currency = payment.Currency,
            ManualReference = payment.ManualReference,
            ConfirmedAtUtc = payment.ConfirmedAtUtc,
            RejectedAtUtc = payment.RejectedAtUtc,
            FailureReason = payment.FailureReason
        };
    }

    private void EnsureManualBusinessPayment(Payment payment)
    {
        if (payment.Method is PaymentMethod.Yape or PaymentMethod.Plin)
        {
            return;
        }

        throw new AppException("Solo los pagos Yape o Plin pueden gestionarse manualmente por el negocio.");
    }

    private static void EnsureDeliveryModeCanBeRequested(Restaurant restaurant, CreateOrderRequest request)
    {
        if (request.DeliveryMode != DeliveryMode.BusinessDelivery)
        {
            return;
        }

        if (!restaurant.HasOwnDelivery || restaurant.OwnDeliveryFee is null || restaurant.OwnDeliveryFee < 0m)
        {
            throw new AppException("Este negocio todavía no tiene delivery propio configurado.");
        }
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
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

    private static void EnsurePaymentAllowsOperationalProgress(Order order, Payment? payment, OrderStatus nextStatus)
    {
        if (nextStatus == OrderStatus.Cancelled || order.PaymentMethod == PaymentMethod.Cash)
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

    private async Task NotifyBusinessAboutNewOrderAsync(Order order, Guid businessOwnerUserId, CancellationToken cancellationToken)
    {
        if (order.PaymentMethod != PaymentMethod.Cash)
        {
            return;
        }

        await _notificationService.SendToUserAsync(
            businessOwnerUserId,
            new EventPushNotificationRequest
            {
                Title = "Nuevo pedido en efectivo",
                Body = $"Tienes un nuevo pedido #{order.Id.ToString("N")[..8]}.",
                Data = NotificationPayloadFactory.BusinessOrder(order.Id, $"/business/orders/{order.Id}", "order_created_cash")
            },
            cancellationToken);
    }

    private async Task NotifyCustomerAboutPaymentStatusAsync(
        Payment payment,
        string title,
        string body,
        CancellationToken cancellationToken)
    {
        var customerUserId = await _dbContext.Orders
            .Where(x => x.Id == payment.OrderId)
            .Select(x => x.Customer.UserId)
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            customerUserId,
            new EventPushNotificationRequest
            {
                Title = title,
                Body = body,
                Data = NotificationPayloadFactory.Order(payment.OrderId, $"/orders/{payment.OrderId}", payment.Status == PaymentStatus.Paid ? "payment_confirmed" : "payment_rejected")
            },
            cancellationToken);
    }

    private async Task NotifyBusinessAboutCustomerCancellationAsync(Order order, CancellationToken cancellationToken)
    {
        var restaurantOwner = await _dbContext.Restaurants
            .Where(x => x.Id == order.RestaurantId)
            .Select(x => new { x.OwnerUserId, x.Name })
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            restaurantOwner.OwnerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pedido cancelado",
                Body = $"El cliente canceló su pedido en {restaurantOwner.Name}.",
                Data = NotificationPayloadFactory.Order(order.Id, $"/business/orders/{order.Id}", "order_cancelled")
            },
            cancellationToken);
    }

    private async Task NotifyCustomerAboutRestaurantCancellationAsync(Order order, string restaurantName, CancellationToken cancellationToken)
    {
        var customerUserId = await _dbContext.Customers
            .Where(x => x.Id == order.CustomerId)
            .Select(x => x.UserId)
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            customerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pedido cancelado",
                Body = $"{restaurantName} canceló tu pedido.",
                Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "order_cancelled")
            },
            cancellationToken);
    }

    private async Task NotifyCustomerAboutAdminCancellationAsync(Order order, CancellationToken cancellationToken)
    {
        var customerUserId = await _dbContext.Customers
            .Where(x => x.Id == order.CustomerId)
            .Select(x => x.UserId)
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            customerUserId,
            new EventPushNotificationRequest
            {
                Title = "Pedido cancelado",
                Body = "Tu pedido fue cancelado por soporte.",
                Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "order_cancelled")
            },
            cancellationToken);
    }

    private async Task NotifyRestaurantOrderStatusChangedAsync(
        Order order,
        Restaurant restaurant,
        OrderStatus nextStatus,
        CancellationToken cancellationToken)
    {
        if (nextStatus == OrderStatus.Accepted)
        {
            var customerUserId = await _dbContext.Customers
                .Where(x => x.Id == order.CustomerId)
                .Select(x => x.UserId)
                .FirstAsync(cancellationToken);

            await _notificationService.SendToUserAsync(
                customerUserId,
                new EventPushNotificationRequest
                {
                    Title = "Pedido aceptado",
                    Body = $"{restaurant.Name} aceptó tu pedido.",
                    Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "order_accepted")
                },
                cancellationToken);
            return;
        }

        if (nextStatus == OrderStatus.Cancelled)
        {
            var customerUserId = await _dbContext.Customers
                .Where(x => x.Id == order.CustomerId)
                .Select(x => x.UserId)
                .FirstAsync(cancellationToken);

            await _notificationService.SendToUserAsync(
                customerUserId,
                new EventPushNotificationRequest
                {
                    Title = "Pedido cancelado",
                    Body = $"{restaurant.Name} canceló tu pedido.",
                    Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "order_cancelled")
                },
                cancellationToken);
            return;
        }

        if (nextStatus != OrderStatus.ReadyForPickup)
        {
            return;
        }

        var customerIdTask = _dbContext.Customers
            .Where(x => x.Id == order.CustomerId)
            .Select(x => x.UserId)
            .FirstAsync(cancellationToken);

        var driverUserIdsTask = _dbContext.Drivers
            .Where(x =>
                x.ZoneId == order.ZoneId &&
                x.ApprovalStatus == ApprovalStatus.Approved &&
                x.User.Status == UserStatus.Active &&
                x.IsAvailable)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        await Task.WhenAll(customerIdTask, driverUserIdsTask);

        await _notificationService.SendToUserAsync(
            customerIdTask.Result,
            new EventPushNotificationRequest
            {
                Title = "Pedido listo",
                Body = $"{restaurant.Name} indicó que tu pedido está listo para recoger.",
                Data = NotificationPayloadFactory.Order(order.Id, $"/orders/{order.Id}", "order_ready_for_pickup")
            },
            cancellationToken);

        await _notificationService.SendToUsersAsync(
            driverUserIdsTask.Result,
            new EventPushNotificationRequest
            {
                Title = "Pedido disponible",
                Body = $"Hay un pedido listo para recoger en {restaurant.Name}.",
                Data = NotificationPayloadFactory.DriverOrder(order.Id, $"/driver/orders/{order.Id}", "driver_order_available")
            },
            cancellationToken);
    }

    private static ValidateOrderItemResponse BuildInvalidItemResponse(
        MenuItem menuItem,
        CreateOrderItemRequest requestedItem,
        bool belongsToRestaurant,
        bool isActive,
        bool isAvailable,
        bool hasStock,
        string message)
    {
        return new ValidateOrderItemResponse
        {
            MenuItemId = menuItem.Id,
            ProductName = menuItem.Name,
            RequestedQuantity = requestedItem.Quantity,
            ValidatedQuantity = 0,
            ClientUnitPrice = requestedItem.ClientUnitPrice,
            CurrentUnitPrice = menuItem.Price,
            Subtotal = 0m,
            Exists = true,
            BelongsToRestaurant = belongsToRestaurant,
            IsActive = isActive,
            IsAvailable = isAvailable,
            HasStock = hasStock,
            QuantityAdjusted = false,
            PriceChanged = false,
            Removed = true,
            Message = message
        };
    }

    private static string BuildValidatedItemMessage(string productName, bool quantityAdjusted, int validatedQuantity, bool priceChanged)
    {
        if (quantityAdjusted && priceChanged)
        {
            return $"Adjustments were applied to '{productName}'. Quantity updated to {validatedQuantity} and price refreshed.";
        }

        if (quantityAdjusted)
        {
            return $"Quantity for '{productName}' was adjusted to {validatedQuantity}.";
        }

        if (priceChanged)
        {
            return $"Price for '{productName}' was refreshed.";
        }

        return $"'{productName}' is ready to order.";
    }

    private async Task<CustomerOrderDetailResponse?> TryGetExistingOrderAsync(
        Guid customerId,
        string clientRequestId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(clientRequestId))
        {
            return null;
        }

        var orderId = await _dbContext.Orders
            .Where(x => x.CustomerId == customerId && x.ClientRequestId == clientRequestId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return orderId.HasValue
            ? await GetMyOrderByIdAsync(orderId.Value, cancellationToken)
            : null;
    }

    private static bool IsConcurrentOrderCreationFailure(Exception exception)
    {
        return HasPostgresSqlState(exception, "40001") || HasPostgresSqlState(exception, "40P01");
    }

    private static bool HasPostgresSqlState(Exception? exception, string expectedSqlState)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            var sqlStateProperty = current.GetType().GetProperty("SqlState");
            if (sqlStateProperty?.GetValue(current) is string sqlState && sqlState == expectedSqlState)
            {
                return true;
            }
        }

        return false;
    }

    private static Payment BuildInitialPayment(Order order)
    {
        var paymentStatus = order.PaymentMethod switch
        {
            PaymentMethod.Cash => PaymentStatus.Pending,
            PaymentMethod.Yape or PaymentMethod.Plin => PaymentStatus.PendingConfirmation,
            _ => throw new AppException("El método de pago no está soportado.")
        };

        return new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Method = order.PaymentMethod,
            Status = paymentStatus,
            Amount = order.Total,
            Currency = "PEN"
        };
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

        if (order.PaymentMethod == PaymentMethod.Cash)
        {
            AddOrderMovement(order, null, FinancialMovementType.CashOrderDebt, order.PlatformRevenueAmount, "Pending AppuraPe commission and service fee debt generated by a cash order.", occurredAtUtc, orderReference);
            return;
        }

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
