using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<PendingCustomerRegistration> PendingCustomerRegistrations => Set<PendingCustomerRegistration>();

    public DbSet<PendingRestaurantRegistration> PendingRestaurantRegistrations => Set<PendingRestaurantRegistration>();

    public DbSet<PendingDriverRegistration> PendingDriverRegistrations => Set<PendingDriverRegistration>();

    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();

    public DbSet<CustomerProfile> Customers => Set<CustomerProfile>();

    public DbSet<CollaboratorProfile> CollaboratorProfiles => Set<CollaboratorProfile>();

    public DbSet<CommunityCollaborator> CommunityCollaborators => Set<CommunityCollaborator>();

    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();

    public DbSet<BusinessType> BusinessTypes => Set<BusinessType>();

    public DbSet<PlatformSettings> PlatformSettings => Set<PlatformSettings>();

    public DbSet<CommissionRule> CommissionRules => Set<CommissionRule>();

    public DbSet<FinancialMovement> FinancialMovements => Set<FinancialMovement>();

    public DbSet<SettlementBatch> SettlementBatches => Set<SettlementBatch>();

    public DbSet<SettlementItem> SettlementItems => Set<SettlementItem>();

    public DbSet<CollaboratorVerification> CollaboratorVerifications => Set<CollaboratorVerification>();

    public DbSet<Restaurant> Restaurants => Set<Restaurant>();

    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    public DbSet<DriverProfile> Drivers => Set<DriverProfile>();

    public DbSet<CommunityRoute> CommunityRoutes => Set<CommunityRoute>();

    public DbSet<CommunityRequest> CommunityRequests => Set<CommunityRequest>();

    public DbSet<CommunityRequestApplication> CommunityRequestApplications => Set<CommunityRequestApplication>();

    public DbSet<Zone> Zones => Set<Zone>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderDeliveryConfirmationAudit> OrderDeliveryConfirmationAudits => Set<OrderDeliveryConfirmationAudit>();

    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<PaymentEvidence> PaymentEvidence => Set<PaymentEvidence>();

    public DbSet<FinancialObligation> FinancialObligations => Set<FinancialObligation>();

    public DbSet<RefundRequest> RefundRequests => Set<RefundRequest>();

    public DbSet<RefundEvidence> RefundEvidence => Set<RefundEvidence>();

    public DbSet<FinancialAuditEvent> FinancialAuditEvents => Set<FinancialAuditEvent>();

    public DbSet<UserDeviceToken> UserDeviceTokens => Set<UserDeviceToken>();

    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();

    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();

    public DbSet<UserLegalAcceptance> UserLegalAcceptances => Set<UserLegalAcceptance>();

    public DbSet<AccountDeletionRequest> AccountDeletionRequests => Set<AccountDeletionRequest>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<OrderIncident> OrderIncidents => Set<OrderIncident>();

    IQueryable<User> IAppDbContext.Users => Users;

    IQueryable<PendingCustomerRegistration> IAppDbContext.PendingCustomerRegistrations => PendingCustomerRegistrations;

    IQueryable<PendingRestaurantRegistration> IAppDbContext.PendingRestaurantRegistrations => PendingRestaurantRegistrations;

    IQueryable<PendingDriverRegistration> IAppDbContext.PendingDriverRegistrations => PendingDriverRegistrations;

    IQueryable<PasswordResetRequest> IAppDbContext.PasswordResetRequests => PasswordResetRequests;

    IQueryable<CustomerProfile> IAppDbContext.Customers => Customers;

    IQueryable<CollaboratorProfile> IAppDbContext.CollaboratorProfiles => CollaboratorProfiles;

    IQueryable<CommunityCollaborator> IAppDbContext.CommunityCollaborators => CommunityCollaborators;

    IQueryable<CustomerAddress> IAppDbContext.CustomerAddresses => CustomerAddresses;

    IQueryable<BusinessType> IAppDbContext.BusinessTypes => BusinessTypes;

    IQueryable<PlatformSettings> IAppDbContext.PlatformSettings => PlatformSettings;

    IQueryable<CommissionRule> IAppDbContext.CommissionRules => CommissionRules;

    IQueryable<FinancialMovement> IAppDbContext.FinancialMovements => FinancialMovements;

    IQueryable<SettlementBatch> IAppDbContext.SettlementBatches => SettlementBatches;

    IQueryable<SettlementItem> IAppDbContext.SettlementItems => SettlementItems;

    IQueryable<CollaboratorVerification> IAppDbContext.CollaboratorVerifications => CollaboratorVerifications;

    IQueryable<Restaurant> IAppDbContext.Restaurants => Restaurants;

    IQueryable<DriverProfile> IAppDbContext.Drivers => Drivers;

    IQueryable<CommunityRoute> IAppDbContext.CommunityRoutes => CommunityRoutes;

    IQueryable<CommunityRequest> IAppDbContext.CommunityRequests => CommunityRequests;

    IQueryable<CommunityRequestApplication> IAppDbContext.CommunityRequestApplications => CommunityRequestApplications;

    IQueryable<MenuCategory> IAppDbContext.MenuCategories => MenuCategories;

    IQueryable<MenuItem> IAppDbContext.MenuItems => MenuItems;

    IQueryable<Order> IAppDbContext.Orders => Orders;

    IQueryable<OrderDeliveryConfirmationAudit> IAppDbContext.OrderDeliveryConfirmationAudits => OrderDeliveryConfirmationAudits;

    IQueryable<Payment> IAppDbContext.Payments => Payments;

    IQueryable<PaymentEvidence> IAppDbContext.PaymentEvidence => PaymentEvidence;

    IQueryable<FinancialObligation> IAppDbContext.FinancialObligations => FinancialObligations;

    IQueryable<RefundRequest> IAppDbContext.RefundRequests => RefundRequests;

    IQueryable<RefundEvidence> IAppDbContext.RefundEvidence => RefundEvidence;

    IQueryable<FinancialAuditEvent> IAppDbContext.FinancialAuditEvents => FinancialAuditEvents;

    IQueryable<UserDeviceToken> IAppDbContext.UserDeviceTokens => UserDeviceTokens;

    IQueryable<UserNotification> IAppDbContext.UserNotifications => UserNotifications;

    IQueryable<LegalDocument> IAppDbContext.LegalDocuments => LegalDocuments;

    IQueryable<UserLegalAcceptance> IAppDbContext.UserLegalAcceptances => UserLegalAcceptances;

    IQueryable<AccountDeletionRequest> IAppDbContext.AccountDeletionRequests => AccountDeletionRequests;

    IQueryable<OrderItem> IAppDbContext.OrderItems => OrderItems;

    IQueryable<Zone> IAppDbContext.Zones => Zones;

    public new void Add<TEntity>(TEntity entity)
        where TEntity : class
    {
        base.Add(entity);
    }

    public new void Remove<TEntity>(TEntity entity)
        where TEntity : class
    {
        base.Remove(entity);
    }

    public override int SaveChanges()
    {
        ValidateImmutableFinancialMovements();
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ValidateImmutableFinancialMovements();
        ApplyTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    private void ApplyTimestamps()
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = utcNow;
                entry.Entity.UpdatedAtUtc = null;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(nameof(BaseEntity.CreatedAtUtc)).IsModified = false;
                entry.Entity.UpdatedAtUtc = utcNow;
            }
        }
    }

    private void ValidateImmutableFinancialMovements()
    {
        if (ChangeTracker.Entries<FinancialAuditEvent>().Any(x => x.State is EntityState.Modified or EntityState.Deleted))
            throw new InvalidOperationException("Financial audit events are immutable.");

        foreach (var entry in ChangeTracker.Entries<FinancialMovement>().Where(x => x.State is EntityState.Modified or EntityState.Deleted))
        {
            var immutable = entry.State == EntityState.Deleted
                ? entry.Entity.IsImmutable
                : entry.Property(x => x.IsImmutable).OriginalValue;
            var reconciliation = entry.State == EntityState.Deleted
                ? entry.Entity.ReconciliationStatus
                : entry.Property(x => x.ReconciliationStatus).OriginalValue;
            if (immutable && reconciliation != FinancialReconciliationStatus.LegacyReconciliationPending)
                throw new InvalidOperationException("Financial movements are immutable; register a reversal movement instead of editing or deleting them.");
        }
    }
}
