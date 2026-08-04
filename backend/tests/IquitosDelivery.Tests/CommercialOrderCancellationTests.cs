using FluentValidation;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Application.Validators;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;

namespace IquitosDelivery.Tests;

public class CommercialOrderCancellationTests
{
    [Fact]
    public async Task Customer_CancelsPendingOrder_RestoresStockAndCancelsPendingEffects()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Pending);
        var service = CreateOrderService(dbContext, fixture.CustomerUserId, UserRole.Customer);

        var result = await service.CancelMyOrderAsync(fixture.OrderId, new CancelOrderRequest { Reason = "Ya no lo necesito" });

        var order = await dbContext.Orders.AsNoTracking().SingleAsync(x => x.Id == fixture.OrderId);
        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);
        var payment = await dbContext.Payments.AsNoTracking().SingleAsync(x => x.OrderId == fixture.OrderId);
        var movement = await dbContext.FinancialMovements.AsNoTracking().SingleAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal(OrderStatus.Cancelled.ToString(), result.Status);
        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Equal(2, menuItem.StockQuantity);
        Assert.True(menuItem.IsAvailable);
        Assert.Equal(PaymentStatus.Failed, payment.Status);
        Assert.Equal("Ya no lo necesito", payment.FailureReason);
        Assert.Equal(FinancialMovementStatus.Cancelled, movement.Status);
    }

    [Fact]
    public async Task Customer_CannotCancelAcceptedOrder_AndStockIsNotRestored()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Accepted);
        var service = CreateOrderService(dbContext, fixture.CustomerUserId, UserRole.Customer);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.CancelMyOrderAsync(fixture.OrderId, new CancelOrderRequest()));

        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);

        Assert.Equal("El pedido ya no puede ser cancelado.", exception.Message);
        Assert.Equal(0, menuItem.StockQuantity);
    }

    [Fact]
    public async Task Restaurant_CancelsPreparingPaidManualOrder_RestoresStockAndMarksPaymentRefunded()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.Paid, OrderStatus.Preparing);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId, UserRole.Restaurant);

        var result = await service.CancelRestaurantOrderAsync(fixture.OrderId, new CancelOrderRequest { Reason = "Sin insumos" });

        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);
        var payment = await dbContext.Payments.AsNoTracking().SingleAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal(OrderStatus.Cancelled.ToString(), result.Status);
        Assert.Equal(2, menuItem.StockQuantity);
        Assert.Equal(PaymentStatus.Refunded, payment.Status);
        Assert.Equal("Sin insumos", payment.FailureReason);
    }

    [Fact]
    public async Task Restaurant_CannotCancelReadyForPickupOrder()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.ReadyForPickup);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId, UserRole.Restaurant);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.CancelRestaurantOrderAsync(fixture.OrderId, new CancelOrderRequest()));

        var order = await dbContext.Orders.AsNoTracking().SingleAsync(x => x.Id == fixture.OrderId);
        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);

        Assert.Equal("El pedido ya no puede ser cancelado.", exception.Message);
        Assert.Equal(OrderStatus.ReadyForPickup, order.Status);
        Assert.Equal(0, menuItem.StockQuantity);
    }

    [Fact]
    public async Task Admin_CancelsReadyForPickupWithoutCourier()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Plin, PaymentStatus.PendingConfirmation, OrderStatus.ReadyForPickup);
        var service = CreateOrderService(dbContext, Guid.NewGuid(), UserRole.Admin);

        var result = await service.CancelAdminOrderAsync(fixture.OrderId, new CancelOrderRequest());

        var payment = await dbContext.Payments.AsNoTracking().SingleAsync(x => x.OrderId == fixture.OrderId);
        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);

        Assert.Equal(OrderStatus.Cancelled.ToString(), result.Status);
        Assert.Equal(PaymentStatus.Failed, payment.Status);
        Assert.Equal(2, menuItem.StockQuantity);
    }

    [Fact]
    public async Task CancellingAlreadyCancelledOrder_DoesNotRestoreStockTwice()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Pending);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId, UserRole.Restaurant);

        await service.CancelRestaurantOrderAsync(fixture.OrderId, new CancelOrderRequest());

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.CancelRestaurantOrderAsync(fixture.OrderId, new CancelOrderRequest()));
        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);

        Assert.Equal("El pedido ya fue cancelado.", exception.Message);
        Assert.Equal(2, menuItem.StockQuantity);
    }

    [Fact]
    public async Task CreateOrder_TrackStockTrue_DiscountsExactQuantity()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedOrderCreationFixtureAsync(dbContext, trackStock: true, stockQuantity: 5);
        var service = CreateOrderService(dbContext, fixture.CustomerUserId, UserRole.Customer);

        await service.CreateOrderAsync(BuildCreateOrderRequest(fixture, quantity: 3));

        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);
        Assert.Equal(2, menuItem.StockQuantity);
        Assert.True(menuItem.IsAvailable);
    }

    [Fact]
    public async Task CreateOrder_TrackStockFalse_DoesNotDiscountStock()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedOrderCreationFixtureAsync(dbContext, trackStock: false, stockQuantity: null);
        var service = CreateOrderService(dbContext, fixture.CustomerUserId, UserRole.Customer);

        await service.CreateOrderAsync(BuildCreateOrderRequest(fixture, quantity: 3));

        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);
        Assert.Null(menuItem.StockQuantity);
        Assert.True(menuItem.IsAvailable);
    }

    [Fact]
    public async Task CreateOrder_InsufficientStock_FailsAndKeepsStock()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedOrderCreationFixtureAsync(dbContext, trackStock: true, stockQuantity: 2);
        var service = CreateOrderService(dbContext, fixture.CustomerUserId, UserRole.Customer);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.CreateOrderAsync(BuildCreateOrderRequest(fixture, quantity: 3)));

        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);
        Assert.Equal("Quantity for 'Juane order' was adjusted to 2.", exception.Message);
        Assert.Equal(2, menuItem.StockQuantity);
    }

    [Fact]
    public async Task Customer_CannotReadOrCancelForeignOrder()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Pending);
        var foreignCustomerUserId = await SeedAdditionalCustomerAsync(dbContext);
        var service = CreateOrderService(dbContext, foreignCustomerUserId, UserRole.Customer);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetMyOrderByIdAsync(fixture.OrderId));
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.CancelMyOrderAsync(fixture.OrderId, new CancelOrderRequest { Reason = "Intento ajeno" }));

        var order = await dbContext.Orders.AsNoTracking().SingleAsync(x => x.Id == fixture.OrderId);
        var menuItem = await dbContext.MenuItems.AsNoTracking().SingleAsync(x => x.Id == fixture.MenuItemId);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal(0, menuItem.StockQuantity);
    }

    [Fact]
    public async Task Restaurant_CannotReadOperateOrCancelForeignOrder()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCancellableOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Pending);
        var foreignRestaurantOwnerId = await SeedAdditionalRestaurantAsync(dbContext, fixture.OrderId);
        var service = CreateOrderService(dbContext, foreignRestaurantOwnerId, UserRole.Restaurant);

        await Assert.ThrowsAsync<ForbiddenException>(() => service.GetRestaurantOrderByIdAsync(fixture.OrderId));
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateRestaurantOrderStatusAsync(fixture.OrderId, new UpdateOrderStatusRequest { Status = OrderStatus.Accepted }));
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.CancelRestaurantOrderAsync(fixture.OrderId, new CancelOrderRequest { Reason = "Intento ajeno" }));

        var order = await dbContext.Orders.AsNoTracking().SingleAsync(x => x.Id == fixture.OrderId);
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options);
    }

    private static OrderService CreateOrderService(AppDbContext dbContext, Guid userId, UserRole role)
    {
        var notifications = new Mock<INotificationService>();
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<EventPushNotificationRequest>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new OrderService(
            dbContext,
            new TestCurrentUserService(userId, role.ToString()),
            notifications.Object,
            new CreateOrderRequestValidator(),
            Mock.Of<IValidator<ConfirmRestaurantOrderPaymentRequest>>(),
            Mock.Of<IValidator<RateDriverRequest>>(),
            Mock.Of<IValidator<RejectRestaurantOrderPaymentRequest>>(),
            new UpdateOrderStatusRequestValidator());
    }

    private static CreateOrderRequest BuildCreateOrderRequest(OrderCreationFixture fixture, int quantity)
    {
        return new CreateOrderRequest
        {
            ClientRequestId = Guid.NewGuid().ToString("N"),
            RestaurantId = fixture.RestaurantId,
            ZoneId = fixture.ZoneId,
            DeliveryAddress = "Av. Pedido 123",
            DeliveryReference = "Casa verde",
            PaymentMethod = PaymentMethod.Cash,
            Items =
            [
                new CreateOrderItemRequest
                {
                    MenuItemId = fixture.MenuItemId,
                    Quantity = quantity,
                    ClientUnitPrice = 10m
                }
            ]
        };
    }

    private static async Task<CancellationFixture> SeedCancellableOrderAsync(
        AppDbContext dbContext,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus)
    {
        var zoneId = Guid.NewGuid();
        var restaurantOwnerId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var menuItemId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        dbContext.Zones.Add(new Zone
        {
            Id = zoneId,
            Name = "Belen",
            DeliveryFee = 5m,
            IsActive = true
        });

        dbContext.Users.AddRange(
            new User
            {
                Id = restaurantOwnerId,
                FirstName = "Owner",
                LastName = "Cancel",
                Phone = "900000001",
                Email = "owner-cancel@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            },
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Cancel",
                Phone = "900000002",
                Email = "customer-cancel@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            });

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = customerUserId
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = restaurantOwnerId,
            Name = "Resto Cancel",
            Description = "Desc",
            Address = "Dir",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = true
        });

        dbContext.MenuCategories.Add(new MenuCategory
        {
            Id = categoryId,
            RestaurantId = restaurantId,
            Name = "Platos",
            SortOrder = 1,
            IsActive = true
        });

        dbContext.MenuItems.Add(new MenuItem
        {
            Id = menuItemId,
            RestaurantId = restaurantId,
            CategoryId = categoryId,
            Name = "Juane",
            Description = "Juane regional",
            Price = 10m,
            TrackStock = true,
            StockQuantity = 0,
            IsAvailable = false,
            IsActive = true
        });

        dbContext.Orders.Add(new Order
        {
            Id = orderId,
            ClientRequestId = Guid.NewGuid().ToString("N"),
            CustomerId = customerId,
            RestaurantId = restaurantId,
            ZoneId = zoneId,
            Status = orderStatus,
            PaymentMethod = paymentMethod,
            Subtotal = 20m,
            BusinessCommissionAmount = 1m,
            BusinessNetAmount = 19m,
            DeliveryFee = 5m,
            DeliveryPlatformCommissionAmount = 1m,
            CourierEarningAmount = 3m,
            ServiceFeeAmount = 0m,
            DiscountAmount = 0m,
            PlatformRevenueAmount = 2m,
            Total = 25m,
            DeliveryAddress = "Av. Demo 123",
            DeliveryReference = "Puerta azul",
            Items =
            [
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    MenuItemId = menuItemId,
                    ProductName = "Juane",
                    UnitPrice = 10m,
                    Quantity = 2,
                    Subtotal = 20m
                }
            ]
        });

        dbContext.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Method = paymentMethod,
            Status = paymentStatus,
            Amount = 25m,
            Currency = "PEN"
        });

        dbContext.FinancialMovements.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            RestaurantId = restaurantId,
            UserId = restaurantOwnerId,
            Type = FinancialMovementType.BusinessNetAmount,
            Status = FinancialMovementStatus.Pending,
            Amount = 19m,
            CurrencyCode = "PEN",
            OccurredAtUtc = DateTime.UtcNow,
            Reference = $"ORDER-{orderId:N}",
            Description = "Pending business movement."
        });

        await dbContext.SaveChangesAsync();

        return new CancellationFixture(
            RestaurantOwnerId: restaurantOwnerId,
            CustomerUserId: customerUserId,
            OrderId: orderId,
            MenuItemId: menuItemId);
    }

    private sealed record CancellationFixture(
        Guid RestaurantOwnerId,
        Guid CustomerUserId,
        Guid OrderId,
        Guid MenuItemId);

    private static async Task<Guid> SeedAdditionalCustomerAsync(AppDbContext dbContext)
    {
        var userId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FirstName = "Cliente",
            LastName = "Ajeno",
            Phone = "900000021",
            Email = $"foreign-customer-{userId:N}@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            Status = UserStatus.Active
        });

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = userId
        });

        await dbContext.SaveChangesAsync();
        return userId;
    }

    private static async Task<Guid> SeedAdditionalRestaurantAsync(AppDbContext dbContext, Guid referenceOrderId)
    {
        var zoneId = await dbContext.Orders
            .Where(x => x.Id == referenceOrderId)
            .Select(x => x.ZoneId)
            .SingleAsync();
        var ownerId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = ownerId,
            FirstName = "Owner",
            LastName = "Ajeno",
            Phone = "900000022",
            Email = $"foreign-owner-{ownerId:N}@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Restaurant,
            Status = UserStatus.Active
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = ownerId,
            Name = "Resto Ajeno",
            Description = "Desc",
            Address = "Dir",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = true
        });

        await dbContext.SaveChangesAsync();
        return ownerId;
    }

    private static async Task<OrderCreationFixture> SeedOrderCreationFixtureAsync(
        AppDbContext dbContext,
        bool trackStock,
        int? stockQuantity)
    {
        var zoneId = Guid.NewGuid();
        var restaurantOwnerId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var menuItemId = Guid.NewGuid();

        dbContext.Zones.Add(new Zone
        {
            Id = zoneId,
            Name = "Belen",
            DeliveryFee = 5m,
            IsActive = true
        });

        dbContext.Users.AddRange(
            new User
            {
                Id = restaurantOwnerId,
                FirstName = "Owner",
                LastName = "Order",
                Phone = "900000011",
                Email = "owner-order@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            },
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Order",
                Phone = "900000012",
                Email = "customer-order@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            });

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = customerUserId
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = restaurantOwnerId,
            Name = "Resto Order",
            Description = "Desc",
            Address = "Dir",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = true
        });

        dbContext.MenuCategories.Add(new MenuCategory
        {
            Id = categoryId,
            RestaurantId = restaurantId,
            Name = "Platos",
            SortOrder = 1,
            IsActive = true
        });

        dbContext.MenuItems.Add(new MenuItem
        {
            Id = menuItemId,
            RestaurantId = restaurantId,
            CategoryId = categoryId,
            Name = "Juane order",
            Description = "Juane order description",
            Price = 10m,
            TrackStock = trackStock,
            StockQuantity = stockQuantity,
            IsAvailable = true,
            IsActive = true
        });

        await dbContext.SaveChangesAsync();
        return new OrderCreationFixture(customerUserId, restaurantId, zoneId, menuItemId);
    }

    private sealed record OrderCreationFixture(
        Guid CustomerUserId,
        Guid RestaurantId,
        Guid ZoneId,
        Guid MenuItemId);

    private sealed class TestCurrentUserService(Guid userId, string role) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "test@appurape.test";

        public string? Role { get; } = role;

        public bool IsAuthenticated => true;
    }
}
