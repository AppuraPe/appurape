using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace IquitosDelivery.Tests;

public class InternalCommerceMvpFinanceTests
{
    [Fact]
    public async Task CollaboratorVerification_RequestAndApprove_ChargesOnce()
    {
        await using var dbContext = CreateDbContext();
        var collaboratorUserId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();
        SeedUser(dbContext, collaboratorUserId, "driver@appurape.test", UserRole.Driver);
        SeedUser(dbContext, adminUserId, "admin@appurape.test", UserRole.Admin);
        dbContext.CollaboratorProfiles.Add(new CollaboratorProfile
        {
            Id = Guid.NewGuid(),
            UserId = collaboratorUserId,
            ApprovalStatus = ApprovalStatus.Pending,
            IsPhoneVerified = true,
            ProfilePhotoUrl = "https://public.example.test/profile.jpg",
            IdentityDocumentUrl = "private/identity-document.jpg",
            LiveSelfieUrl = "private/live-selfie.jpg",
            LiveSelfieCapturedAtUtc = DateTime.UtcNow
        });
        SeedRule(dbContext, FinancialRuleCodes.CollaboratorVerificationFee, 5m);
        await dbContext.SaveChangesAsync();

        var collaboratorService = new CollaboratorVerificationService(dbContext, new TestCurrentUserService(collaboratorUserId, UserRole.Driver));
        var requested = await collaboratorService.RequestVerificationAsync();
        var repeatedRequest = await collaboratorService.RequestVerificationAsync();

        Assert.Equal(requested.Id, repeatedRequest.Id);
        Assert.Equal("PendingVerification", requested.Status);
        Assert.Equal(5m, requested.VerificationFeeAmount);
        Assert.Equal(1, await dbContext.CollaboratorVerifications.CountAsync());

        var adminService = new CollaboratorVerificationService(dbContext, new TestCurrentUserService(adminUserId, UserRole.Admin));
        var approved = await adminService.ApproveAsync(requested.Id);
        var approvedAgain = await adminService.ApproveAsync(requested.Id);
        var movement = await dbContext.FinancialMovements.AsNoTracking().SingleAsync(x => x.UserId == collaboratorUserId);

        Assert.Equal("Verified", approved.Status);
        Assert.Equal("Verified", approvedAgain.Status);
        Assert.Equal(FinancialMovementType.CollaboratorVerificationFee, movement.Type);
        Assert.Equal(FinancialMovementStatus.Available, movement.Status);
        Assert.Equal(5m, movement.Amount);
        Assert.Equal(1, await dbContext.FinancialMovements.CountAsync(x => x.UserId == collaboratorUserId));
    }

    [Fact]
    public async Task Settlement_CreateAndMarkPaid_MarksMovementsSettled()
    {
        await using var dbContext = CreateDbContext();
        var restaurantId = await SeedRestaurantAsync(dbContext);
        var businessCommission = SeedMovement(dbContext, restaurantId, FinancialMovementType.BusinessCommission, 1.2m);
        var serviceFee = SeedMovement(dbContext, restaurantId, FinancialMovementType.ServiceFee, 1m);
        await dbContext.SaveChangesAsync();
        var service = CreateAdminFinanceService(dbContext);

        var settlement = await service.CreateSettlementAsync(new CreateSettlementBatchRequest
        {
            TargetType = SettlementTargetType.Business,
            BusinessId = restaurantId,
            PeriodStartUtc = DateTime.UtcNow.AddDays(-1),
            PeriodEndUtc = DateTime.UtcNow,
            FinancialMovementIds = [businessCommission, serviceFee],
            Notes = "QA settlement"
        });

        Assert.Equal("Pending", settlement.Status);
        Assert.Equal(2.2m, settlement.GrossAmount);
        Assert.Equal(1.2m, settlement.CommissionAmount);
        Assert.Equal(1m, settlement.ServiceFeeAmount);
        Assert.Equal(2, settlement.Items.Count);

        var paid = await service.MarkSettlementPaidAsync(settlement.Id);
        var movements = await dbContext.FinancialMovements.AsNoTracking()
            .Where(x => x.Id == businessCommission || x.Id == serviceFee)
            .ToListAsync();

        Assert.Equal("Paid", paid.Status);
        Assert.All(movements, movement =>
        {
            Assert.Equal(FinancialMovementStatus.Settled, movement.Status);
            Assert.NotNull(movement.SettledAtUtc);
        });
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static AdminFinanceService CreateAdminFinanceService(AppDbContext dbContext)
    {
        return new AdminFinanceService(
            dbContext,
            Mock.Of<IValidator<UpdateCommissionRuleRequest>>());
    }

    private static void SeedRule(AppDbContext dbContext, string code, decimal value)
    {
        dbContext.CommissionRules.Add(new CommissionRule
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = code,
            Scope = CommissionRuleScope.CommercialOrder,
            ValueType = CommissionValueType.FlatAmount,
            Value = value,
            IsEnabled = true
        });
    }

    private static async Task<Guid> SeedRestaurantAsync(AppDbContext dbContext)
    {
        var zoneId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        SeedUser(dbContext, ownerUserId, "owner@appurape.test", UserRole.Restaurant);
        dbContext.Zones.Add(new Zone
        {
            Id = zoneId,
            Name = "Centro",
            IsActive = true
        });
        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = ownerUserId,
            Name = "Negocio QA",
            Description = "Negocio para liquidaciones",
            Address = "Jr. QA",
            Reference = "Referencia",
            ZoneId = zoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = true
        });
        await dbContext.SaveChangesAsync();
        return restaurantId;
    }

    private static Guid SeedMovement(AppDbContext dbContext, Guid restaurantId, FinancialMovementType type, decimal amount)
    {
        var movementId = Guid.NewGuid();
        dbContext.FinancialMovements.Add(new FinancialMovement
        {
            Id = movementId,
            RestaurantId = restaurantId,
            Type = type,
            Status = FinancialMovementStatus.Available,
            Amount = amount,
            OccurredAtUtc = DateTime.UtcNow,
            AvailableAtUtc = DateTime.UtcNow,
            Reference = $"MOV-{movementId:N}"
        });
        return movementId;
    }

    private static void SeedUser(AppDbContext dbContext, Guid userId, string email, UserRole role)
    {
        dbContext.Users.Add(new User
        {
            Id = userId,
            FirstName = role.ToString(),
            LastName = "QA",
            Phone = "900000000",
            Email = email,
            PasswordHash = "hash",
            Role = role,
            Status = UserStatus.Active
        });
    }

    private sealed class TestCurrentUserService(Guid userId, UserRole role) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "qa@appurape.test";

        public string? Role => role.ToString();

        public bool IsAuthenticated => true;
    }
}
