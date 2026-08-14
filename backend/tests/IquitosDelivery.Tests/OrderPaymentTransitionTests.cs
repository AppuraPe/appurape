using FluentValidation;
using IquitosDelivery.Application.DTOs.Drivers;
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
using Moq;

namespace IquitosDelivery.Tests;

public class OrderPaymentTransitionTests
{
    [Fact]
    public async Task Restaurant_YapePendingConfirmation_IsBlocked()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedRestaurantOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.PendingConfirmation, OrderStatus.Pending);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.UpdateRestaurantOrderStatusAsync(fixture.OrderId, new UpdateOrderStatusRequest { Status = OrderStatus.Accepted }));

        Assert.Equal("El pago aún no ha sido confirmado.", exception.Message);
    }

    [Fact]
    public async Task Restaurant_YapePaid_IsAllowed()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedRestaurantOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.Paid, OrderStatus.Pending);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId);

        var result = await service.UpdateRestaurantOrderStatusAsync(
            fixture.OrderId,
            new UpdateOrderStatusRequest { Status = OrderStatus.Accepted });

        Assert.Equal(OrderStatus.Accepted.ToString(), result.Status);
    }

    [Fact]
    public async Task Restaurant_YapeRejected_IsBlocked()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedRestaurantOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.Rejected, OrderStatus.Pending);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.UpdateRestaurantOrderStatusAsync(fixture.OrderId, new UpdateOrderStatusRequest { Status = OrderStatus.Accepted }));

        Assert.Equal("El pedido no puede continuar porque el pago no está disponible.", exception.Message);
    }

    [Fact]
    public async Task Restaurant_CashPending_IsAllowed()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedRestaurantOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Pending);
        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId);

        var result = await service.UpdateRestaurantOrderStatusAsync(
            fixture.OrderId,
            new UpdateOrderStatusRequest { Status = OrderStatus.Accepted });

        Assert.Equal(OrderStatus.Accepted.ToString(), result.Status);
    }

    [Fact]
    public async Task Restaurant_ReadyForPickup_NotifiesCustomerAndDrivers()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedRestaurantOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Preparing);
        var zoneId = await dbContext.Orders.Where(x => x.Id == fixture.OrderId).Select(x => x.ZoneId).SingleAsync();
        var driverUserId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = driverUserId,
            FirstName = "Driver",
            LastName = "Disponible",
            Phone = "900000004",
            Email = "driver-ready@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Driver,
            Status = UserStatus.Active
        });

        dbContext.Drivers.Add(new DriverProfile
        {
            Id = Guid.NewGuid(),
            UserId = driverUserId,
            ZoneId = zoneId,
            VehicleType = VehicleType.Motorcycle,
            Plate = "DRV-001",
            ApprovalStatus = ApprovalStatus.Approved,
            IsAvailable = true,
            TrustLevel = TrustLevel.Verified,
            TrustScore = 100m
        });
        await dbContext.SaveChangesAsync();

        var notifications = new Mock<INotificationService>(MockBehavior.Strict);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "order_ready_for_pickup"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUsersAsync(
                It.Is<IEnumerable<Guid>>(userIds => userIds.Contains(driverUserId)),
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["type"] == "driver_order"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateOrderService(dbContext, fixture.RestaurantOwnerId, notifications.Object);

        await service.UpdateRestaurantOrderStatusAsync(
            fixture.OrderId,
            new UpdateOrderStatusRequest { Status = OrderStatus.ReadyForPickup });

        notifications.VerifyAll();
    }

    [Fact]
    public async Task Driver_CannotTakeOrder_BlockedByPendingPayment()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedDriverAvailableOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.PendingConfirmation, OrderStatus.ReadyForPickup);
        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId);

        var exception = await Assert.ThrowsAsync<AppException>(() => service.TakeOrderAsync(fixture.OrderId));

        Assert.Equal("El pago aún no ha sido confirmado.", exception.Message);
    }

    [Fact]
    public async Task Driver_CashPending_Delivered_ClosesPayment()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.OnTheWay);
        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId);

        var result = await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered });

        var payment = await dbContext.Payments.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);
        var courierMovement = await dbContext.FinancialMovements.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal(OrderStatus.Delivered.ToString(), result.Status);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.NotNull(payment.PaidAtUtc);
        Assert.Equal(fixture.DriverUserId, payment.ConfirmedByUserId);
        Assert.Equal(FinancialMovementStatus.Available, courierMovement.Status);
    }

    [Fact]
    public async Task Driver_Delivered_NotifiesCustomerAndBusiness()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.OnTheWay);
        var notifications = new Mock<INotificationService>(MockBehavior.Strict);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "order_delivered"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "driver_order_delivered"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId, notifications.Object);

        await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered });

        notifications.VerifyAll();
    }

    [Fact]
    public async Task Admin_YapeConfirmed_NotifiesBusinessAndCustomer()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedRestaurantOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.PendingConfirmation, OrderStatus.Pending);
        var notifications = new Mock<INotificationService>(MockBehavior.Strict);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "payment_confirmed"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "payment_confirmed_admin"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateAdminPaymentService(dbContext, Guid.NewGuid(), notifications.Object);

        await service.ConfirmPaymentAsync(fixture.OrderId);

        notifications.VerifyAll();
    }

    [Fact]
    public async Task Driver_Cash_Assigned_CanAdvanceThroughFullDeliveryFlow()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.Assigned);
        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId);

        var pickedUp = await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.PickedUp });

        var onTheWay = await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.OnTheWay });

        var delivered = await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered });

        var payment = await dbContext.Payments.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal(OrderStatus.PickedUp.ToString(), pickedUp.Status);
        Assert.Equal(OrderStatus.OnTheWay.ToString(), onTheWay.Status);
        Assert.Equal(OrderStatus.Delivered.ToString(), delivered.Status);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
    }

    [Fact]
    public async Task Driver_CashAlreadyPaid_DeliveredRetry_IsIdempotent()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Paid, OrderStatus.Delivered);
        var originalPayment = await dbContext.Payments.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);
        var originalMovement = await dbContext.FinancialMovements.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);
        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId);

        var result = await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered });

        var payment = await dbContext.Payments.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);
        var movement = await dbContext.FinancialMovements.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal(OrderStatus.Delivered.ToString(), result.Status);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.Equal(originalPayment.PaidAtUtc, payment.PaidAtUtc);
        Assert.Equal(originalMovement.Status, movement.Status);
        Assert.Equal(originalMovement.AvailableAtUtc, movement.AvailableAtUtc);
    }

    [Fact]
    public async Task Driver_YapePaid_Delivered_PreservesPayment()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.Paid, OrderStatus.OnTheWay);
        var originalPayment = await dbContext.Payments.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);
        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId);

        var result = await service.UpdateMyOrderStatusAsync(
            fixture.OrderId,
            new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered });

        var payment = await dbContext.Payments.AsNoTracking().FirstAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal(OrderStatus.Delivered.ToString(), result.Status);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.Equal(originalPayment.PaidAtUtc, payment.PaidAtUtc);
    }

    [Fact]
    public async Task Driver_YapePendingConfirmation_CannotReachDelivered()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.PendingConfirmation, OrderStatus.OnTheWay);
        var service = CreateDriverOrderService(dbContext, fixture.DriverUserId);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.UpdateMyOrderStatusAsync(fixture.OrderId, new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered }));

        Assert.Equal("El pago aún no ha sido confirmado.", exception.Message);
    }

    [Fact]
    public async Task Driver_DeliveryFailure_DoesNotPersistPartialChanges()
    {
        var databaseName = Guid.NewGuid().ToString("N");

        await using (var seedContext = CreateDbContext(databaseName))
        {
            await SeedAssignedDriverOrderAsync(seedContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.OnTheWay);
        }

        await using (var failingContext = new FailingAppDbContext(CreateOptions(databaseName)))
        {
            var orderId = await failingContext.Orders.Select(x => x.Id).SingleAsync();
            var driverUserId = await failingContext.Drivers.Select(x => x.UserId).SingleAsync();
            failingContext.ThrowOnSave = true;
            var service = CreateDriverOrderService(failingContext, driverUserId);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.UpdateMyOrderStatusAsync(orderId, new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered }));
        }

        await using (var verificationContext = CreateDbContext(databaseName))
        {
            var order = await verificationContext.Orders.AsNoTracking().SingleAsync();
            var payment = await verificationContext.Payments.AsNoTracking().SingleAsync();

            Assert.Equal(OrderStatus.OnTheWay, order.Status);
            Assert.Null(order.DeliveredAtUtc);
            Assert.Equal(PaymentStatus.Pending, payment.Status);
            Assert.Null(payment.PaidAtUtc);
        }
    }

    [Fact]
    public async Task Driver_UpdateDelivered_Unauthorized_IsRejected()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedAssignedDriverOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending, OrderStatus.PickedUp);
        var otherDriverUserId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = otherDriverUserId,
            FirstName = "Other",
            LastName = "Driver",
            Phone = "900000099",
            Email = "other-driver@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Driver,
            Status = UserStatus.Active
        });

        dbContext.Drivers.Add(new DriverProfile
        {
            Id = Guid.NewGuid(),
            UserId = otherDriverUserId,
            ZoneId = await dbContext.Zones.Select(x => x.Id).SingleAsync(),
            VehicleType = VehicleType.Motorcycle,
            Plate = "OTH-999",
            ApprovalStatus = ApprovalStatus.Approved,
            IsAvailable = true,
            TrustLevel = TrustLevel.Verified,
            TrustScore = 100m
        });

        await dbContext.SaveChangesAsync();

        var service = CreateDriverOrderService(dbContext, otherDriverUserId);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateMyOrderStatusAsync(fixture.OrderId, new UpdateDriverOrderStatusRequest { Status = OrderStatus.Delivered }));
    }

    private static AppDbContext CreateDbContext(string? databaseName = null)
    {
        return new AppDbContext(CreateOptions(databaseName));
    }

    private static DbContextOptions<AppDbContext> CreateOptions(string? databaseName = null)
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString("N"))
            .Options;
    }

    private static OrderService CreateOrderService(AppDbContext dbContext, Guid userId, INotificationService? notificationService = null)
    {
        return new OrderService(
            dbContext,
            new TestCurrentUserService(userId, "Restaurant"),
            notificationService ?? Mock.Of<INotificationService>(),
            Mock.Of<IValidator<CreateOrderRequest>>(),
            Mock.Of<IValidator<ConfirmRestaurantOrderPaymentRequest>>(),
            Mock.Of<IValidator<RateDriverRequest>>(),
            Mock.Of<IValidator<RejectRestaurantOrderPaymentRequest>>(),
            new UpdateOrderStatusRequestValidator());
    }

    private static DriverOrderService CreateDriverOrderService(AppDbContext dbContext, Guid userId, INotificationService? notificationService = null)
    {
        return new DriverOrderService(
            dbContext,
            new TestCurrentUserService(userId, "Driver"),
            notificationService ?? Mock.Of<INotificationService>(),
            new UpdateDriverOrderStatusRequestValidator());
    }

    private static AdminPaymentService CreateAdminPaymentService(AppDbContext dbContext, Guid userId, INotificationService? notificationService = null)
    {
        return new AdminPaymentService(
            dbContext,
            new TestCurrentUserService(userId, "Admin"),
            notificationService ?? Mock.Of<INotificationService>());
    }

    private static async Task<(Guid RestaurantOwnerId, Guid OrderId)> SeedRestaurantOrderAsync(
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
                LastName = "Restaurant",
                Phone = "900000001",
                Email = "owner@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            },
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Demo",
                Phone = "900000002",
                Email = "customer@appurape.test",
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
            Name = "Resto Demo",
            Description = "Desc",
            Address = "Dir",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
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
            BusinessCommissionAmount = 0m,
            BusinessNetAmount = 20m,
            DeliveryFee = 5m,
            DeliveryPlatformCommissionAmount = 0m,
            CourierEarningAmount = 0m,
            ServiceFeeAmount = 0m,
            DiscountAmount = 0m,
            PlatformRevenueAmount = 0m,
            Total = 25m,
            DeliveryAddress = "Av. Demo 123",
            DeliveryReference = "Puerta azul"
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

        await dbContext.SaveChangesAsync();
        return (restaurantOwnerId, orderId);
    }

    private static async Task<(Guid DriverUserId, Guid OrderId)> SeedDriverAvailableOrderAsync(
        AppDbContext dbContext,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus)
    {
        var zoneId = Guid.NewGuid();
        var restaurantOwnerId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var driverUserId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
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
                LastName = "Restaurant",
                Phone = "900000011",
                Email = "owner-driver@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            },
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Driver",
                Phone = "900000012",
                Email = "customer-driver@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            },
            new User
            {
                Id = driverUserId,
                FirstName = "Driver",
                LastName = "Demo",
                Phone = "900000013",
                Email = "driver@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Driver,
                Status = UserStatus.Active
            });

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = customerUserId
        });

        dbContext.Drivers.Add(new DriverProfile
        {
            Id = driverId,
            UserId = driverUserId,
            ZoneId = zoneId,
            VehicleType = VehicleType.Motorcycle,
            Plate = "ABC-123",
            ApprovalStatus = ApprovalStatus.Approved,
            IsAvailable = true,
            TrustLevel = TrustLevel.Verified,
            TrustScore = 100m
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = restaurantOwnerId,
            Name = "Resto Driver",
            Description = "Desc",
            Address = "Dir",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
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
            BusinessCommissionAmount = 0m,
            BusinessNetAmount = 20m,
            DeliveryFee = 5m,
            DeliveryPlatformCommissionAmount = 0m,
            CourierEarningAmount = 3m,
            ServiceFeeAmount = 0m,
            DiscountAmount = 0m,
            PlatformRevenueAmount = 0m,
            Total = 25m,
            DeliveryAddress = "Av. Demo 456",
            DeliveryReference = "Porton negro",
            ReadyAtUtc = DateTime.UtcNow
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

        await dbContext.SaveChangesAsync();
        return (driverUserId, orderId);
    }

    private static async Task<(Guid DriverUserId, Guid OrderId)> SeedAssignedDriverOrderAsync(
        AppDbContext dbContext,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus)
    {
        var zoneId = Guid.NewGuid();
        var restaurantOwnerId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var driverUserId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var paidAtUtc = paymentStatus == PaymentStatus.Paid ? DateTime.UtcNow.AddMinutes(-10) : (DateTime?)null;

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
                LastName = "Restaurant",
                Phone = "900000021",
                Email = "owner-assigned@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            },
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Assigned",
                Phone = "900000022",
                Email = "customer-assigned@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            },
            new User
            {
                Id = driverUserId,
                FirstName = "Driver",
                LastName = "Assigned",
                Phone = "900000023",
                Email = "driver-assigned@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Driver,
                Status = UserStatus.Active
            });

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = customerUserId
        });

        dbContext.Drivers.Add(new DriverProfile
        {
            Id = driverId,
            UserId = driverUserId,
            ZoneId = zoneId,
            VehicleType = VehicleType.Motorcycle,
            Plate = "XYZ-123",
            ApprovalStatus = ApprovalStatus.Approved,
            IsAvailable = false,
            TrustLevel = TrustLevel.Verified,
            TrustScore = 100m
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = restaurantOwnerId,
            Name = "Resto Assigned",
            Description = "Desc",
            Address = "Dir",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = true
        });

        dbContext.Orders.Add(new Order
        {
            Id = orderId,
            ClientRequestId = Guid.NewGuid().ToString("N"),
            CustomerId = customerId,
            RestaurantId = restaurantId,
            DriverId = driverId,
            AssignedCourierUserId = driverUserId,
            AssignedCourierType = CourierType.Driver,
            ZoneId = zoneId,
            Status = orderStatus,
            PaymentMethod = paymentMethod,
            Subtotal = 20m,
            BusinessCommissionAmount = 0m,
            BusinessNetAmount = 20m,
            DeliveryFee = 5m,
            DeliveryPlatformCommissionAmount = 1m,
            CourierEarningAmount = 3m,
            ServiceFeeAmount = 0m,
            DiscountAmount = 0m,
            PlatformRevenueAmount = 1m,
            Total = 25m,
            DeliveryAddress = "Av. Assigned 789",
            DeliveryReference = "Frente al parque",
            PickedUpAtUtc = orderStatus is OrderStatus.PickedUp or OrderStatus.Delivered ? DateTime.UtcNow.AddMinutes(-5) : null,
            DeliveredAtUtc = orderStatus == OrderStatus.Delivered ? DateTime.UtcNow.AddMinutes(-1) : null
        });

        dbContext.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Method = paymentMethod,
            Status = paymentStatus,
            Amount = 25m,
            Currency = "PEN",
            PaidAtUtc = paidAtUtc,
            ConfirmedAtUtc = paidAtUtc,
            ConfirmedByUserId = paidAtUtc.HasValue ? driverUserId : null
        });

        dbContext.FinancialMovements.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            RestaurantId = restaurantId,
            UserId = driverUserId,
            Type = FinancialMovementType.CourierEarning,
            Status = orderStatus == OrderStatus.Delivered ? FinancialMovementStatus.Available : FinancialMovementStatus.Pending,
            Amount = 3m,
            CurrencyCode = "PEN",
            OccurredAtUtc = DateTime.UtcNow.AddMinutes(-20),
            AvailableAtUtc = orderStatus == OrderStatus.Delivered ? DateTime.UtcNow.AddMinutes(-1) : null,
            Reference = $"ORDER-{orderId:N}",
            Description = "Courier earning reserved for the delivery."
        });

        await dbContext.SaveChangesAsync();
        return (driverUserId, orderId);
    }

    private sealed class TestCurrentUserService(Guid userId, string role) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "test@appurape.test";

        public string? Role { get; } = role;

        public bool IsAuthenticated => true;
    }

    private sealed class FailingAppDbContext(DbContextOptions<AppDbContext> options) : AppDbContext(options)
    {
        public bool ThrowOnSave { get; set; }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            if (ThrowOnSave)
            {
                throw new InvalidOperationException("Simulated transaction failure.");
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
