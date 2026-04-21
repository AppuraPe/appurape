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

    public DbSet<CustomerProfile> Customers => Set<CustomerProfile>();

    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();

    public DbSet<Restaurant> Restaurants => Set<Restaurant>();

    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    public DbSet<DriverProfile> Drivers => Set<DriverProfile>();

    public DbSet<Zone> Zones => Set<Zone>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<OrderIncident> OrderIncidents => Set<OrderIncident>();

    IQueryable<User> IAppDbContext.Users => Users;

    IQueryable<PendingCustomerRegistration> IAppDbContext.PendingCustomerRegistrations => PendingCustomerRegistrations;

    IQueryable<PendingRestaurantRegistration> IAppDbContext.PendingRestaurantRegistrations => PendingRestaurantRegistrations;

    IQueryable<PendingDriverRegistration> IAppDbContext.PendingDriverRegistrations => PendingDriverRegistrations;

    IQueryable<CustomerProfile> IAppDbContext.Customers => Customers;

    IQueryable<Restaurant> IAppDbContext.Restaurants => Restaurants;

    IQueryable<DriverProfile> IAppDbContext.Drivers => Drivers;

    IQueryable<MenuCategory> IAppDbContext.MenuCategories => MenuCategories;

    IQueryable<MenuItem> IAppDbContext.MenuItems => MenuItems;

    IQueryable<Order> IAppDbContext.Orders => Orders;

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
