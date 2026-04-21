using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace IquitosDelivery.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<Interfaces.IAuthService, Services.AuthService>();
        services.AddScoped<Interfaces.ICustomerRegistrationService, Services.CustomerRegistrationService>();
        services.AddScoped<Interfaces.IRestaurantRegistrationService, Services.RestaurantRegistrationService>();
        services.AddScoped<Interfaces.IDriverRegistrationService, Services.DriverRegistrationService>();
        services.AddScoped<Interfaces.IRestaurantService, Services.RestaurantService>();
        services.AddScoped<Interfaces.IMenuService, Services.MenuService>();
        services.AddScoped<Interfaces.IOrderService, Services.OrderService>();
        services.AddScoped<Interfaces.IDriverOrderService, Services.DriverOrderService>();
        services.AddScoped<Interfaces.IAdminRestaurantService, Services.AdminRestaurantService>();
        services.AddScoped<Interfaces.IAdminDriverService, Services.AdminDriverService>();
        services.AddScoped<Interfaces.IZoneService, Services.ZoneService>();

        return services;
    }
}
