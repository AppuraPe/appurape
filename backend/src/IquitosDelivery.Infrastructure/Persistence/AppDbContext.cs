using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Entities;
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

    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<UserDeviceToken> UserDeviceTokens => Set<UserDeviceToken>();

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

    IQueryable<Payment> IAppDbContext.Payments => Payments;

    IQueryable<UserDeviceToken> IAppDbContext.UserDeviceTokens => UserDeviceTokens;

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
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
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
}
