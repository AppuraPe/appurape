using FluentValidation;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

namespace IquitosDelivery.Tests;

public sealed class FinanceSecurityV2Tests
{
    private static readonly IConfiguration EnabledConfiguration = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["FinanceV2:Enabled"] = "true" })
        .Build();

    [Fact]
    public async Task CashDriver_CreatesSeparateBusinessNetAndPlatformObligations()
    {
        await using var db = CreateDb();
        var service = new FinanceSecurityService(db, new CurrentUser(Guid.NewGuid()), Mock.Of<IFileStorageService>(), EnabledConfiguration);
        var order = new Order
        {
            Id = Guid.NewGuid(), RestaurantId = Guid.NewGuid(), PaymentMethod = PaymentMethod.Cash,
            DeliveryMode = DeliveryMode.VerifiedDriverDelivery, BusinessNetAmount = 30m,
            PlatformRevenueAmount = 3m, CourierEarningAmount = 7m, Total = 40m
        };

        await service.CreateOrderObligationsAsync(order, Guid.NewGuid());
        await db.SaveChangesAsync();
        var obligations = await db.FinancialObligations.AsNoTracking().ToListAsync();

        Assert.Equal(2, obligations.Count);
        Assert.Contains(obligations, x => x.DebtorType == FinancialPartyType.Driver && x.CreditorType == FinancialPartyType.Business && x.Amount == 30m);
        Assert.Contains(obligations, x => x.DebtorType == FinancialPartyType.Driver && x.CreditorType == FinancialPartyType.Platform && x.Amount == 3m);
        Assert.Equal(order.BusinessNetAmount + order.PlatformRevenueAmount, obligations.Sum(x => x.Amount));
    }

    [Fact]
    public async Task CashFavor_CreatesOnlyPlatformFeeDebt_NotSecondCollaboratorPayout()
    {
        await using var db = CreateDb();
        var service = new FinanceSecurityService(db, new CurrentUser(Guid.NewGuid()), Mock.Of<IFileStorageService>(), EnabledConfiguration);
        var favor = new CommunityRequest
        {
            Id = Guid.NewGuid(), FavorPlatformCommissionAmount = 1m, CollaboratorEarningAmount = 8m,
            DeadlineUtc = DateTime.UtcNow.AddHours(4), PricingSnapshotJson = "{}"
        };

        await service.CreateFavorObligationAsync(favor);
        await db.SaveChangesAsync();
        var obligation = await db.FinancialObligations.AsNoTracking().SingleAsync();

        Assert.Equal(FinancialObligationConcept.FavorPlatformFeeCustody, obligation.Concept);
        Assert.Equal(FinancialPartyType.Collaborator, obligation.DebtorType);
        Assert.Equal(FinancialPartyType.Platform, obligation.CreditorType);
        Assert.Equal(1m, obligation.Amount);
    }

    [Fact]
    public async Task Settlement_RequiresDifferentApproverAndVerifier()
    {
        await using var db = CreateDb();
        var creatorId = Guid.NewGuid();
        var approverId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        db.FinancialObligations.Add(new FinancialObligation
        {
            Id = Guid.NewGuid(), DebtorType = FinancialPartyType.Business, DebtorEntityId = businessId,
            CreditorType = FinancialPartyType.Platform, Concept = FinancialObligationConcept.PlatformRevenueCustody,
            Status = FinancialObligationStatus.Available, Amount = 4m, AvailableAtUtc = DateTime.UtcNow, Reference = "ORDER-QA"
        });
        await db.SaveChangesAsync();
        var storage = new Mock<IFileStorageService>();
        storage.Setup(x => x.UploadPrivateImageAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("private/settlement.jpg");
        var creator = CreateAdminService(db, creatorId, storage.Object);
        var obligation = await db.FinancialObligations.SingleAsync();
        var batch = await creator.CreateSettlementAsync(new CreateSettlementBatchRequest
        {
            TargetType = SettlementTargetType.Business, BusinessId = businessId,
            PeriodStartUtc = DateTime.UtcNow.AddMinutes(-5), PeriodEndUtc = DateTime.UtcNow.AddMinutes(5),
            FinancialObligationIds = [obligation.Id]
        });

        await Assert.ThrowsAsync<IquitosDelivery.Application.Exceptions.AppException>(() => creator.ApproveSettlementAsync(batch.Id));
        var approver = CreateAdminService(db, approverId, storage.Object);
        var approved = await approver.ApproveSettlementAsync(batch.Id);
        Assert.Equal("Approved", approved.Status);
        await creator.ReportSettlementPaymentAsync(batch.Id, new ReportSettlementPaymentRequest("OP-1234", 4m, DateTime.UtcNow, [1, 2, 3], "proof.jpg", "image/jpeg"));
        await Assert.ThrowsAsync<IquitosDelivery.Application.Exceptions.AppException>(() => creator.MarkSettlementPaidAsync(batch.Id));
        var paid = await approver.MarkSettlementPaidAsync(batch.Id);
        Assert.Equal("Paid", paid.Status);
        Assert.Equal(FinancialObligationStatus.Settled, (await db.FinancialObligations.SingleAsync()).Status);
    }

    [Fact]
    public async Task CurrentFinancialMovement_CannotBeEditedOrDeleted()
    {
        await using var db = CreateDb();
        var movement = new FinancialMovement
        {
            Id = Guid.NewGuid(), Type = FinancialMovementType.CashOrderDebt, Status = FinancialMovementStatus.Settled,
            Amount = 2m, OccurredAtUtc = DateTime.UtcNow, IsImmutable = true,
            ReconciliationStatus = FinancialReconciliationStatus.Current, Reference = "IMMUTABLE-QA"
        };
        db.FinancialMovements.Add(movement);
        await db.SaveChangesAsync();
        movement.Amount = 3m;

        await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
    }

    private static AdminFinanceService CreateAdminService(AppDbContext db, Guid userId, IFileStorageService storage) =>
        new(db, Mock.Of<IValidator<UpdateCommissionRuleRequest>>(), new CurrentUser(userId), storage, EnabledConfiguration);

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);

    private sealed class CurrentUser(Guid id) : ICurrentUserService
    {
        public Guid? UserId => id;
        public string? Email => "admin@appurape.test";
        public string? Role => "Admin";
        public bool IsAuthenticated => true;
    }
}
