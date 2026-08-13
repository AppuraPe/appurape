using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Application.Validators;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using IquitosDelivery.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace IquitosDelivery.Tests;

public class AuthServiceTests
{
    private const string Password = "AppuraPe123*";

    [Theory]
    [InlineData(UserRole.Customer)]
    [InlineData(UserRole.Restaurant)]
    [InlineData(UserRole.Driver)]
    [InlineData(UserRole.Admin)]
    public async Task LoginAsync_ValidCredentials_ReturnsRoleAndActiveStatus(UserRole role)
    {
        await using var dbContext = CreateDbContext();
        var email = $"{role.ToString().ToLowerInvariant()}@appurape.test";
        var userId = await SeedUserWithProfileAsync(dbContext, role, UserStatus.Active, email);
        var service = CreateAuthService(dbContext, userId);

        var response = await service.LoginAsync(new LoginRequest
        {
            Email = email,
            Password = Password
        });

        Assert.Equal(userId, response.UserId);
        Assert.Equal(role.ToString(), response.Role);
        Assert.Equal(UserStatus.Active.ToString(), response.Status);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorized()
    {
        await using var dbContext = CreateDbContext();
        await SeedUserWithProfileAsync(dbContext, UserRole.Customer, UserStatus.Active, "customer@appurape.test");
        var service = CreateAuthService(dbContext);

        var exception = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest
            {
                Email = "customer@appurape.test",
                Password = "wrong-password"
            }));

        Assert.Equal("Invalid email or password.", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_SuspendedUser_ThrowsUnauthorized()
    {
        await using var dbContext = CreateDbContext();
        await SeedUserWithProfileAsync(dbContext, UserRole.Customer, UserStatus.Suspended, "suspended@appurape.test");
        var service = CreateAuthService(dbContext);

        var exception = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest
            {
                Email = "suspended@appurape.test",
                Password = Password
            }));

        Assert.Equal("Your account is suspended.", exception.Message);
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsRoleStatusAndProfiles()
    {
        await using var dbContext = CreateDbContext();
        var userId = await SeedUserWithProfileAsync(dbContext, UserRole.Driver, UserStatus.Active, "driver@appurape.test");
        var service = CreateAuthService(dbContext, userId);

        var response = await service.GetCurrentUserAsync();

        Assert.Equal(userId, response.UserId);
        Assert.Equal(UserRole.Driver.ToString(), response.Role);
        Assert.Equal(UserStatus.Active.ToString(), response.Status);
        Assert.True(response.HasDriverProfile);
        Assert.Contains(UserRole.Driver.ToString(), response.AvailableProfiles);
    }

    [Fact]
    public async Task StartPasswordResetAsync_DoesNotRevealWhetherEmailExists()
    {
        await using var dbContext = CreateDbContext();
        await SeedUserWithProfileAsync(dbContext, UserRole.Customer, UserStatus.Active, "known@appurape.test");
        var service = CreateAuthService(dbContext);

        var known = await service.StartPasswordResetAsync(new ForgotPasswordRequest { Email = "known@appurape.test" });
        var unknown = await service.StartPasswordResetAsync(new ForgotPasswordRequest { Email = "unknown@appurape.test" });

        Assert.Equal("If the account exists, we sent a recovery code.", known.Message);
        Assert.Equal("If the account exists, we sent a recovery code.", unknown.Message);
        Assert.Equal("known@appurape.test", known.Email);
        Assert.Equal("unknown@appurape.test", unknown.Email);
    }

    [Fact]
    public async Task ResetPasswordAsync_InvalidCode_FailsAndDoesNotChangePassword()
    {
        await using var dbContext = CreateDbContext();
        await SeedUserWithProfileAsync(dbContext, UserRole.Customer, UserStatus.Active, "reset@appurape.test");
        var service = CreateAuthService(dbContext);

        await service.StartPasswordResetAsync(new ForgotPasswordRequest { Email = "reset@appurape.test" });

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.ResetPasswordAsync(new ResetPasswordRequest
            {
                Email = "reset@appurape.test",
                Code = "000000",
                NewPassword = "NewPass123*"
            }));

        Assert.Equal("Verification code is invalid.", exception.Message);

        var user = await dbContext.Users.AsNoTracking().SingleAsync(x => x.Email == "reset@appurape.test");
        Assert.True(new PasswordHasher().Verify(Password, user.PasswordHash));
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static AuthService CreateAuthService(AppDbContext dbContext, Guid? currentUserId = null)
    {
        return new AuthService(
            dbContext,
            new TestCurrentUserService(currentUserId),
            Mock.Of<IEmailSender>(),
            Mock.Of<IGoogleTokenVerifier>(),
            new FakeJwtTokenService(),
            new ForgotPasswordRequestValidator(),
            new PasswordHasher(),
            new GoogleLoginRequestValidator(),
            new LoginRequestValidator(),
            Mock.Of<IValidator<RegisterDriverRequest>>(),
            Mock.Of<IValidator<RegisterRestaurantRequest>>(),
            new ResendPasswordResetCodeRequestValidator(),
            new ResetPasswordRequestValidator(),
            Mock.Of<ILegalService>());
    }

    private static async Task<Guid> SeedUserWithProfileAsync(
        AppDbContext dbContext,
        UserRole role,
        UserStatus status,
        string email)
    {
        var userId = Guid.NewGuid();
        var zoneId = Guid.NewGuid();

        dbContext.Zones.Add(new Zone
        {
            Id = zoneId,
            Name = $"Zone {role}",
            DeliveryFee = 5m,
            IsActive = true
        });

        var user = new User
        {
            Id = userId,
            FirstName = role.ToString(),
            LastName = "Tester",
            Phone = "900000000",
            Email = email,
            PasswordHash = new PasswordHasher().Hash(Password),
            Role = role,
            Status = status
        };

        dbContext.Users.Add(user);

        if (role == UserRole.Customer)
        {
            dbContext.Customers.Add(new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId
            });
        }

        if (role == UserRole.Restaurant)
        {
            dbContext.Restaurants.Add(new Restaurant
            {
                Id = Guid.NewGuid(),
                OwnerUserId = userId,
                Name = "Resto Auth",
                Description = "Auth business",
                Address = "Av. Auth",
                Reference = "Ref",
                ZoneId = zoneId,
                ApprovalStatus = ApprovalStatus.Approved,
                OpenTime = TimeSpan.FromHours(8),
                CloseTime = TimeSpan.FromHours(22),
                IsActive = true
            });
        }

        if (role == UserRole.Driver)
        {
            dbContext.Drivers.Add(new DriverProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ZoneId = zoneId,
                VehicleType = VehicleType.Motorcycle,
                Plate = "DRV-001",
                ApprovalStatus = ApprovalStatus.Approved,
                IsAvailable = true,
                TrustLevel = TrustLevel.Verified,
                TrustScore = 100m
            });
        }

        await dbContext.SaveChangesAsync();
        return userId;
    }

    private sealed class FakeJwtTokenService : IJwtTokenService
    {
        public string GenerateToken(User user)
        {
            return $"token-{user.Id:N}";
        }
    }

    private sealed class TestCurrentUserService(Guid? userId) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "current@appurape.test";

        public string? Role => UserRole.Customer.ToString();

        public bool IsAuthenticated => UserId.HasValue;
    }
}
