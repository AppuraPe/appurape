using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Tests;

public class OrderDeliveryConfirmationServiceTests
{
    [Fact]
    public async Task CustomerCanReadStableCodeAndRegenerateOnlyOnce()
    {
        await using var db = CreateDb();
        var seeded = await SeedAsync(db);
        var service = CreateService(db, seeded.User.Id);

        var first = await service.GetForCustomerAsync(seeded.Order.Id);
        var repeated = await service.GetForCustomerAsync(seeded.Order.Id);
        var regenerated = await service.RegenerateForCustomerAsync(seeded.Order.Id);

        Assert.Matches("^[0-9]{6}$", first.Code);
        Assert.Equal(first.Code, repeated.Code);
        Assert.NotEqual(first.Code, regenerated.Code);
        await Assert.ThrowsAsync<AppException>(() => service.RegenerateForCustomerAsync(seeded.Order.Id));
    }

    [Fact]
    public async Task FiveInvalidAttemptsPersistAndLockCode()
    {
        await using var db = CreateDb();
        var seeded = await SeedAsync(db);
        var service = CreateService(db, seeded.User.Id);
        var response = await service.GetForCustomerAsync(seeded.Order.Id);

        for (var attempt = 0; attempt < 5; attempt++)
            await Assert.ThrowsAsync<AppException>(() => service.ValidateAsync(seeded.Order, response.Code == "000000" ? "999999" : "000000", seeded.User.Id));

        Assert.NotNull(seeded.Order.DeliveryConfirmationLockedAtUtc);
        Assert.Equal(5, seeded.Order.DeliveryConfirmationFailedAttempts);
        Assert.Equal(5, await db.OrderDeliveryConfirmationAudits.CountAsync(x => x.Action == "FailedAttempt"));
    }

    private static OrderDeliveryConfirmationService CreateService(AppDbContext db, Guid userId)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["OrderConfirmation:Key"] = "order-confirmation-test-key-at-least-32-bytes"
        }).Build();
        return new OrderDeliveryConfirmationService(db, new CurrentUser(userId), configuration);
    }

    private static async Task<(User User, Order Order)> SeedAsync(AppDbContext db)
    {
        var user = new User { Id = Guid.NewGuid(), FirstName = "Test", LastName = "Customer", Email = "confirmation@test.local", Phone = "900000000", PasswordHash = "hash", Role = UserRole.Customer, Status = UserStatus.Active };
        var customer = new CustomerProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var order = new Order { Id = Guid.NewGuid(), CustomerId = customer.Id, Customer = customer, Status = OrderStatus.ReadyForPickup, DeliveryAddress = "", DeliveryReference = "" };
        db.AddRange(user, customer, order);
        await db.SaveChangesAsync();
        return (user, order);
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
    private sealed class CurrentUser(Guid userId) : ICurrentUserService
    {
        public Guid? UserId => userId;
        public string? Email => null;
        public string? Role => "Customer";
        public bool IsAuthenticated => true;
    }
}
