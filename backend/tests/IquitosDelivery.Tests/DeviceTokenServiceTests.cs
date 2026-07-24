using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Tests;

public class DeviceTokenServiceTests
{
    [Fact]
    public async Task RegisterAsync_CreatesToken_ForAuthenticatedUser()
    {
        await using var dbContext = CreateDbContext();
        var userId = await SeedUserAsync(dbContext, UserRole.Customer, "customer-token@appurape.test");
        var service = new DeviceTokenService(dbContext, new TestCurrentUserService(userId, UserRole.Customer.ToString()));

        await service.RegisterAsync(new RegisterDeviceTokenRequest
        {
            Token = "token-123",
            Platform = "android",
            DeviceId = "device-a",
            AppVersion = "1.0.0"
        });

        var savedToken = await dbContext.UserDeviceTokens.AsNoTracking().SingleAsync();

        Assert.Equal(userId, savedToken.UserId);
        Assert.Equal(UserRole.Customer, savedToken.Role);
        Assert.Equal("token-123", savedToken.Token);
        Assert.Equal("android", savedToken.Platform);
        Assert.True(savedToken.IsActive);
        Assert.NotEqual(default, savedToken.LastSeenAtUtc);
    }

    [Fact]
    public async Task RegisterAsync_ReusesExistingToken_AndReassignsUser()
    {
        await using var dbContext = CreateDbContext();
        var originalUserId = await SeedUserAsync(dbContext, UserRole.Customer, "first-token@appurape.test");
        var newUserId = await SeedUserAsync(dbContext, UserRole.Driver, "second-token@appurape.test");

        dbContext.Add(new UserDeviceToken
        {
            Id = Guid.NewGuid(),
            UserId = originalUserId,
            Role = UserRole.Customer,
            Token = "shared-token",
            Platform = "android",
            IsActive = false,
            LastSeenAtUtc = DateTime.UtcNow.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();

        var service = new DeviceTokenService(dbContext, new TestCurrentUserService(newUserId, UserRole.Driver.ToString()));

        await service.RegisterAsync(new RegisterDeviceTokenRequest
        {
            Token = "shared-token",
            Platform = "android",
            DeviceId = "device-b",
            AppVersion = "2.0.0"
        });

        var savedToken = await dbContext.UserDeviceTokens.AsNoTracking().SingleAsync();

        Assert.Equal(newUserId, savedToken.UserId);
        Assert.Equal(UserRole.Driver, savedToken.Role);
        Assert.True(savedToken.IsActive);
        Assert.Equal("device-b", savedToken.DeviceId);
        Assert.Equal("2.0.0", savedToken.AppVersion);
    }

    [Fact]
    public async Task DeactivateAsync_OnlyDisablesCurrentUsersToken()
    {
        await using var dbContext = CreateDbContext();
        var ownerUserId = await SeedUserAsync(dbContext, UserRole.Restaurant, "owner-token@appurape.test");
        var otherUserId = await SeedUserAsync(dbContext, UserRole.Admin, "other-token@appurape.test");

        dbContext.AddRange(
            new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = ownerUserId,
                Role = UserRole.Restaurant,
                Token = "owner-token",
                Platform = "android",
                IsActive = true,
                LastSeenAtUtc = DateTime.UtcNow
            },
            new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId,
                Role = UserRole.Admin,
                Token = "other-token",
                Platform = "android",
                IsActive = true,
                LastSeenAtUtc = DateTime.UtcNow
            });

        await dbContext.SaveChangesAsync();

        var service = new DeviceTokenService(dbContext, new TestCurrentUserService(ownerUserId, UserRole.Restaurant.ToString()));

        await service.DeactivateAsync(new DeactivateDeviceTokenRequest
        {
            Token = "owner-token"
        });

        var tokens = await dbContext.UserDeviceTokens.AsNoTracking().ToListAsync();
        var ownerToken = tokens.Single(x => x.Token == "owner-token");
        var otherToken = tokens.Single(x => x.Token == "other-token");

        Assert.False(ownerToken.IsActive);
        Assert.True(otherToken.IsActive);
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static async Task<Guid> SeedUserAsync(AppDbContext dbContext, UserRole role, string email)
    {
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FirstName = role.ToString(),
            LastName = "Tester",
            Phone = "900000000",
            Email = email,
            PasswordHash = "hash",
            Role = role,
            Status = UserStatus.Active
        });

        await dbContext.SaveChangesAsync();
        return userId;
    }

    private sealed class TestCurrentUserService(Guid userId, string role) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "test@appurape.test";

        public string? Role { get; } = role;

        public bool IsAuthenticated => true;
    }
}
