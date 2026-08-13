using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

namespace IquitosDelivery.Tests;

public class OrderFulfillmentServiceTests
{
    [Fact]
    public async Task QuoteAndCreateLinksOrderWithoutChangingProductTotal()
    {
        await using var db = CreateDbContext();
        var seeded = await SeedAsync(db);
        var service = CreateService(db, seeded.CustomerUser.Id);
        var originalTotal = seeded.Order.Total;

        var quote = await service.QuoteCollaboratorPickupAsync(seeded.Order.Id, new OrderCollaboratorPickupQuoteRequest { CompensationAmount = 5m });
        var result = await service.CreateCollaboratorPickupAsync(seeded.Order.Id, new CreateOrderCollaboratorPickupRequest { QuoteToken = quote.QuoteToken });

        var linked = await db.CommunityRequests.SingleAsync(x => x.Id == result.CommunityRequestId);
        Assert.Equal(seeded.Order.Id, linked.OrderId);
        Assert.Equal(CommunityRequestSourceType.AppuraPeOrder, linked.SourceType);
        Assert.Equal(CommunityRequestType.ProductPickup, linked.Type);
        Assert.Equal(DeliveryMode.CommunityCollaboratorDelivery, seeded.Order.DeliveryMode);
        Assert.Equal(originalTotal, seeded.Order.Total);
        Assert.Equal(quote.TotalAdditionalAmount, linked.TotalClientAmount);
    }

    [Fact]
    public async Task SecondActivePickupIsRejected()
    {
        await using var db = CreateDbContext();
        var seeded = await SeedAsync(db);
        var service = CreateService(db, seeded.CustomerUser.Id);
        var quote = await service.QuoteCollaboratorPickupAsync(seeded.Order.Id, new OrderCollaboratorPickupQuoteRequest { CompensationAmount = 5m });
        await service.CreateCollaboratorPickupAsync(seeded.Order.Id, new CreateOrderCollaboratorPickupRequest { QuoteToken = quote.QuoteToken });

        var error = await Assert.ThrowsAsync<AppException>(() =>
            service.QuoteCollaboratorPickupAsync(seeded.Order.Id, new OrderCollaboratorPickupQuoteRequest { CompensationAmount = 5m }));
        Assert.Contains("ya tiene", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task BusinessPickupRequiresCorrectCodeAndMovesBothStates()
    {
        await using var db = CreateDbContext();
        var seeded = await SeedAsync(db);
        var customerService = CreateService(db, seeded.CustomerUser.Id);
        var quote = await customerService.QuoteCollaboratorPickupAsync(seeded.Order.Id, new OrderCollaboratorPickupQuoteRequest { CompensationAmount = 5m });
        var created = await customerService.CreateCollaboratorPickupAsync(seeded.Order.Id, new CreateOrderCollaboratorPickupRequest { QuoteToken = quote.QuoteToken });
        var linked = await db.CommunityRequests.SingleAsync(x => x.Id == created.CommunityRequestId);
        var collaboratorUser = NewUser(UserRole.Customer, "colaborador@test.local");
        var collaborator = new CommunityCollaborator { Id = Guid.NewGuid(), UserId = collaboratorUser.Id, User = collaboratorUser };
        db.Users.Add(collaboratorUser); db.CommunityCollaborators.Add(collaborator);
        linked.AssignedCollaboratorId = collaborator.Id; linked.AssignedCollaborator = collaborator; linked.Status = CommunityRequestStatus.Accepted;
        seeded.Order.Status = OrderStatus.ReadyForPickup; seeded.Order.AssignedCourierUserId = collaboratorUser.Id; seeded.Order.AssignedCourierType = CourierType.Collaborator;
        await db.SaveChangesAsync();

        var businessService = CreateService(db, seeded.BusinessUser.Id);
        await Assert.ThrowsAsync<AppException>(() => businessService.ConfirmBusinessPickupAsync(seeded.Order.Id, new ConfirmCollaboratorPickupRequest { PickupCode = "000000" }));
        await businessService.ConfirmBusinessPickupAsync(seeded.Order.Id, new ConfirmCollaboratorPickupRequest { PickupCode = linked.PickupCode! });

        Assert.Equal(OrderStatus.PickedUp, seeded.Order.Status);
        Assert.Equal(CommunityRequestStatus.InProcess, linked.Status);
        Assert.NotNull(linked.PickupConfirmedAtUtc);
    }

    [Fact]
    public async Task CashPickupOrderCanSwitchToVerifiedDriverDelivery()
    {
        await using var db = CreateDbContext();
        var seeded = await SeedAsync(db);
        var payment = new Payment { Id = Guid.NewGuid(), OrderId = seeded.Order.Id, Order = seeded.Order, Method = PaymentMethod.Cash, Status = PaymentStatus.Pending, Amount = seeded.Order.Total };
        db.Payments.Add(payment);
        db.CommissionRules.Add(new CommissionRule { Id = Guid.NewGuid(), Code = "Commercial.VerifiedDriverDelivery.From20", Name = "Delivery", Scope = CommissionRuleScope.CommercialOrder, ValueType = CommissionValueType.FlatAmount, Value = 4m, IsEnabled = true });
        await db.SaveChangesAsync();

        var result = await CreateService(db, seeded.CustomerUser.Id).RequestDriverDeliveryAsync(seeded.Order.Id, new RequestOrderDriverDeliveryRequest());

        Assert.Equal("VerifiedDriverDelivery", result.DeliveryMode);
        Assert.Equal(4m, result.DeliveryFee);
        Assert.Equal(result.Total, payment.Amount);
        Assert.Equal(DeliveryMode.VerifiedDriverDelivery, seeded.Order.DeliveryMode);
    }

    private static OrderFulfillmentService CreateService(AppDbContext db, Guid userId)
    {
        var notifications = new Mock<INotificationService>();
        notifications.Setup(x => x.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<EventPushNotificationRequest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        notifications.Setup(x => x.SendToUsersAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<EventPushNotificationRequest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = "test-key-with-enough-entropy-for-signed-quotes" }).Build();
        return new OrderFulfillmentService(db, new CurrentUser(userId), notifications.Object, config);
    }

    private static async Task<Seeded> SeedAsync(AppDbContext db)
    {
        var customerUser = NewUser(UserRole.Customer, "cliente@test.local");
        var businessUser = NewUser(UserRole.Restaurant, "negocio@test.local");
        var customer = new CustomerProfile { Id = Guid.NewGuid(), UserId = customerUser.Id, User = customerUser };
        var zone = new Zone { Id = Guid.NewGuid(), Name = "Iquitos", IsActive = true };
        var restaurant = new Restaurant { Id = Guid.NewGuid(), OwnerUserId = businessUser.Id, OwnerUser = businessUser, Name = "Negocio", Description = "Test", Address = "Av. Origen 123", Reference = "", ZoneId = zone.Id, Zone = zone, IsActive = true, ApprovalStatus = ApprovalStatus.Approved };
        var order = new Order { Id = Guid.NewGuid(), CustomerId = customer.Id, Customer = customer, RestaurantId = restaurant.Id, Restaurant = restaurant, ZoneId = zone.Id, Zone = zone, Status = OrderStatus.Preparing, PaymentMethod = PaymentMethod.Cash, DeliveryMode = DeliveryMode.PickupOrDirect, DeliveryAddress = "Jr. Destino 456", DeliveryReference = "Puerta azul", Subtotal = 20m, BusinessNetAmount = 20m, Total = 20m };
        db.AddRange(customerUser, businessUser, customer, zone, restaurant, order);
        db.CommissionRules.Add(new CommissionRule { Id = Guid.NewGuid(), Code = "Community.SimpleFavor.Minimum", Name = "Mínimo", Scope = CommissionRuleScope.CommunityRequest, ValueType = CommissionValueType.FlatAmount, Value = 2m, IsEnabled = true });
        db.CommissionRules.Add(new CommissionRule { Id = Guid.NewGuid(), Code = "Community.FavorPlatformCommission", Name = "Comisión", Scope = CommissionRuleScope.CommunityRequest, ValueType = CommissionValueType.FlatAmount, Value = 1m, IsEnabled = true });
        await db.SaveChangesAsync();
        return new Seeded(customerUser, businessUser, order);
    }

    private static User NewUser(UserRole role, string email) => new() { Id = Guid.NewGuid(), FirstName = "Test", LastName = "User", Email = email, Phone = "900000000", PasswordHash = "hash", Role = role, Status = UserStatus.Active };
    private static AppDbContext CreateDbContext() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
    private sealed class CurrentUser(Guid userId) : ICurrentUserService { public Guid? UserId => userId; public string? Email => null; public string? Role => null; public bool IsAuthenticated => true; }
    private sealed record Seeded(User CustomerUser, User BusinessUser, Order Order);
}
