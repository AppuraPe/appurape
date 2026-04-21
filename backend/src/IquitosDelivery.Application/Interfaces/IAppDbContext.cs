using IquitosDelivery.Domain.Entities;

namespace IquitosDelivery.Application.Interfaces;

public interface IAppDbContext
{
    IQueryable<User> Users { get; }

    IQueryable<PendingCustomerRegistration> PendingCustomerRegistrations { get; }

    IQueryable<PendingRestaurantRegistration> PendingRestaurantRegistrations { get; }

    IQueryable<PendingDriverRegistration> PendingDriverRegistrations { get; }

    IQueryable<CustomerProfile> Customers { get; }

    IQueryable<Restaurant> Restaurants { get; }

    IQueryable<DriverProfile> Drivers { get; }

    IQueryable<MenuCategory> MenuCategories { get; }

    IQueryable<MenuItem> MenuItems { get; }

    IQueryable<Order> Orders { get; }

    IQueryable<OrderItem> OrderItems { get; }

    IQueryable<Zone> Zones { get; }

    void Add<TEntity>(TEntity entity)
        where TEntity : class;

    void Remove<TEntity>(TEntity entity)
        where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
