using IquitosDelivery.Application.DTOs.Account;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using IquitosDelivery.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace IquitosDelivery.Tests;

public class AccountDeletionServiceTests
{
    [Fact]
    public async Task ConfirmSchedulesDeletionForSevenDaysAndDisablesTokens()
    {
        await using var db = CreateDbContext(); var user = SeedUser(db); var hasher = new PasswordHasher();
        db.AccountDeletionRequests.Add(new AccountDeletionRequest { Id = Guid.NewGuid(), UserId = user.Id, Status = AccountDeletionStatus.CodeSent, VerificationCodeHash = hasher.Hash("123456"), CodeExpiresAtUtc = DateTime.UtcNow.AddMinutes(5) });
        db.UserDeviceTokens.Add(new UserDeviceToken { Id = Guid.NewGuid(), UserId = user.Id, Role = UserRole.Customer, Token = "token", Platform = "android", IsActive = true }); await db.SaveChangesAsync();
        var service = new AccountDeletionService(db, new CurrentUser(user), Mock.Of<IEmailSender>(), hasher);
        var before = DateTime.UtcNow; var result = await service.ConfirmAsync(new ConfirmAccountDeletionRequest { Email = user.Email, Code = "123456" });
        Assert.Equal("PendingDeletion", result.Status); Assert.InRange(result.ScheduledForUtc!.Value, before.AddDays(7), DateTime.UtcNow.AddDays(7));
        Assert.Equal(UserStatus.PendingDeletion, user.Status); Assert.False((await db.UserDeviceTokens.SingleAsync()).IsActive);
    }

    [Fact]
    public async Task CancelRestoresCustomerAccess()
    {
        await using var db = CreateDbContext(); var user = SeedUser(db); user.Status = UserStatus.PendingDeletion;
        db.AccountDeletionRequests.Add(new AccountDeletionRequest { Id = Guid.NewGuid(), UserId = user.Id, Status = AccountDeletionStatus.PendingDeletion, PreviousUserStatus = UserStatus.Active, VerificationCodeHash = "hash", CodeExpiresAtUtc = DateTime.UtcNow, ScheduledForUtc = DateTime.UtcNow.AddDays(7) }); await db.SaveChangesAsync();
        var service = new AccountDeletionService(db, new CurrentUser(user), Mock.Of<IEmailSender>(), new PasswordHasher());
        var result = await service.CancelAsync();
        Assert.Equal("Cancelled", result.Status); Assert.Equal(UserStatus.Active, user.Status);
    }

    private static AppDbContext CreateDbContext() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
    private static User SeedUser(AppDbContext db) { var user = new User { Id = Guid.NewGuid(), FirstName = "Test", LastName = "User", Email = $"{Guid.NewGuid():N}@test.local", Phone = "900000000", PasswordHash = "hash", Role = UserRole.Customer, Status = UserStatus.Active }; db.Users.Add(user); return user; }
    private sealed class CurrentUser(User user) : ICurrentUserService { public Guid? UserId => user.Id; public string? Email => user.Email; public string? Role => user.Role.ToString(); public bool IsAuthenticated => true; }
}
