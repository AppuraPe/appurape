using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace IquitosDelivery.Tests;

public class AdminPaymentServiceTests
{
    [Fact]
    public async Task GetPendingPayments_ReturnsOnlyPendingManualPayments()
    {
        await using var dbContext = CreateDbContext();
        var pendingYape = await SeedPaymentOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.PendingConfirmation);
        var pendingPlin = await SeedPaymentOrderAsync(dbContext, PaymentMethod.Plin, PaymentStatus.PendingConfirmation);
        await SeedPaymentOrderAsync(dbContext, PaymentMethod.Cash, PaymentStatus.Pending);
        await SeedPaymentOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.Paid);
        var service = CreateService(dbContext);

        var result = await service.GetPendingPaymentsAsync();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, x => x.OrderId == pendingYape.OrderId && x.PaymentMethod == "Yape");
        Assert.Contains(result, x => x.OrderId == pendingPlin.OrderId && x.PaymentMethod == "Plin");
    }

    [Fact]
    public async Task ConfirmPayment_PendingYape_MarksPaidAndRejectsRepeat()
    {
        await using var dbContext = CreateDbContext();
        var adminUserId = Guid.NewGuid();
        var fixture = await SeedPaymentOrderAsync(dbContext, PaymentMethod.Yape, PaymentStatus.PendingConfirmation);
        var service = CreateService(dbContext, adminUserId);

        var confirmed = await service.ConfirmPaymentAsync(fixture.OrderId);
        var payment = await dbContext.Payments.AsNoTracking().SingleAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal("Paid", confirmed.PaymentStatus);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.Equal(adminUserId, payment.ConfirmedByUserId);
        Assert.NotNull(payment.ConfirmedAtUtc);
        Assert.NotNull(payment.PaidAtUtc);

        var exception = await Assert.ThrowsAsync<AppException>(() => service.ConfirmPaymentAsync(fixture.OrderId));
        Assert.Equal("Este pago ya fue confirmado.", exception.Message);
    }

    [Fact]
    public async Task RejectPayment_PendingPlin_MarksRejectedAndRejectsRepeat()
    {
        await using var dbContext = CreateDbContext();
        var adminUserId = Guid.NewGuid();
        var fixture = await SeedPaymentOrderAsync(dbContext, PaymentMethod.Plin, PaymentStatus.PendingConfirmation);
        var service = CreateService(dbContext, adminUserId);

        var rejected = await service.RejectPaymentAsync(fixture.OrderId);
        var payment = await dbContext.Payments.AsNoTracking().SingleAsync(x => x.OrderId == fixture.OrderId);

        Assert.Equal("Rejected", rejected.PaymentStatus);
        Assert.Equal(PaymentStatus.Rejected, payment.Status);
        Assert.Equal(adminUserId, payment.ConfirmedByUserId);
        Assert.NotNull(payment.RejectedAtUtc);
        Assert.Equal("Pago rechazado por administracion.", payment.FailureReason);

        var exception = await Assert.ThrowsAsync<AppException>(() => service.RejectPaymentAsync(fixture.OrderId));
        Assert.Equal("Este pago ya fue rechazado.", exception.Message);
    }

    [Fact]
    public async Task ConfirmOrRejectPayment_MissingOrder_ThrowsNotFound()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateService(dbContext);
        var missingOrderId = Guid.NewGuid();

        await Assert.ThrowsAsync<NotFoundException>(() => service.ConfirmPaymentAsync(missingOrderId));
        await Assert.ThrowsAsync<NotFoundException>(() => service.RejectPaymentAsync(missingOrderId));
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static AdminPaymentService CreateService(AppDbContext dbContext, Guid? adminUserId = null)
    {
        var notifications = new Mock<INotificationService>();
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<EventPushNotificationRequest>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new AdminPaymentService(
            dbContext,
            new TestCurrentUserService(adminUserId ?? Guid.NewGuid()),
            notifications.Object);
    }

    private static async Task<PaymentOrderFixture> SeedPaymentOrderAsync(
        AppDbContext dbContext,
        PaymentMethod method,
        PaymentStatus status)
    {
        var zoneId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        dbContext.Zones.Add(new Zone
        {
            Id = zoneId,
            Name = $"Zone {orderId:N}"[..12],
            DeliveryFee = 4m,
            IsActive = true
        });

        dbContext.Users.AddRange(
            CreateUser(customerUserId, $"customer-{orderId:N}@appurape.test", UserRole.Customer),
            CreateUser(ownerUserId, $"owner-{orderId:N}@appurape.test", UserRole.Restaurant));

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = customerUserId
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = ownerUserId,
            Name = $"Resto {method} {status}",
            Description = "Admin payment fixture",
            Address = "Av. Pago",
            Reference = "Caja",
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
            Status = OrderStatus.Pending,
            PaymentMethod = method,
            Subtotal = 10m,
            BusinessCommissionAmount = 1m,
            BusinessNetAmount = 9m,
            DeliveryFee = 4m,
            DeliveryPlatformCommissionAmount = 1m,
            CourierEarningAmount = 3m,
            ServiceFeeAmount = 0m,
            DiscountAmount = 0m,
            PlatformRevenueAmount = 2m,
            Total = 14m,
            DeliveryAddress = "Av. Pago 123",
            DeliveryReference = "Referencia",
            Items =
            [
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    MenuItemId = Guid.NewGuid(),
                    ProductName = "Producto admin",
                    UnitPrice = 10m,
                    Quantity = 1,
                    Subtotal = 10m
                }
            ]
        });

        dbContext.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Method = method,
            Status = status,
            Amount = 14m,
            Currency = "PEN"
        });

        await dbContext.SaveChangesAsync();

        return new PaymentOrderFixture(orderId);
    }

    private static User CreateUser(Guid id, string email, UserRole role)
    {
        return new User
        {
            Id = id,
            FirstName = role.ToString(),
            LastName = "QA",
            Phone = "900000000",
            Email = email,
            PasswordHash = "hash",
            Role = role,
            Status = UserStatus.Active
        };
    }

    private sealed record PaymentOrderFixture(Guid OrderId);

    private sealed class TestCurrentUserService(Guid userId) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "admin@appurape.test";

        public string? Role => UserRole.Admin.ToString();

        public bool IsAuthenticated => true;
    }
}
