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
        services.AddScoped<Interfaces.ICustomerAddressService, Services.CustomerAddressService>();
        services.AddScoped<Interfaces.IRestaurantService, Services.RestaurantService>();
        services.AddScoped<Interfaces.IBusinessService, Services.BusinessServiceAdapter>();
        services.AddScoped<Interfaces.IMenuService, Services.MenuService>();
        services.AddScoped<Interfaces.ICatalogService, Services.CatalogServiceAdapter>();
        services.AddScoped<Interfaces.IOrderService, Services.OrderService>();
        services.AddScoped<Interfaces.IOrderFulfillmentService, Services.OrderFulfillmentService>();
        services.AddScoped<Interfaces.IOrderDeliveryConfirmationService, Services.OrderDeliveryConfirmationService>();
        services.AddScoped<Interfaces.IBusinessOrderService, Services.BusinessOrderServiceAdapter>();
        services.AddScoped<Interfaces.IDriverOrderService, Services.DriverOrderService>();
        services.AddScoped<Interfaces.IAdminRestaurantService, Services.AdminRestaurantService>();
        services.AddScoped<Interfaces.IAdminBusinessService, Services.AdminBusinessServiceAdapter>();
        services.AddScoped<Interfaces.IPlatformSettingsService, Services.PlatformSettingsService>();
        services.AddScoped<Interfaces.IAdminPlatformSettingsService, Services.PlatformSettingsService>();
        services.AddScoped<Interfaces.IAdminDriverService, Services.AdminDriverService>();
        services.AddScoped<Interfaces.IAdminFinanceService, Services.AdminFinanceService>();
        services.AddScoped<Interfaces.IAdminPaymentService, Services.AdminPaymentService>();
        services.AddScoped<Interfaces.IAdminBusinessTypeService, Services.AdminBusinessTypeService>();
        services.AddScoped<Interfaces.ICommunityService, Services.CommunityService>();
        services.AddScoped<Interfaces.IAdminCommunityService, Services.AdminCommunityService>();
        services.AddScoped<Interfaces.ICollaboratorVerificationService, Services.CollaboratorVerificationService>();
        services.AddScoped<Interfaces.IZoneService, Services.ZoneService>();
        services.AddScoped<Interfaces.ISearchService, Services.SearchService>();
        services.AddScoped<Interfaces.IBusinessTypeService, Services.BusinessTypeService>();
        services.AddScoped<Interfaces.IDeviceTokenService, Services.DeviceTokenService>();
        services.AddScoped<Interfaces.INotificationService, Services.NotificationService>();
        services.AddScoped<Interfaces.ILegalService, Services.LegalService>();
        services.AddScoped<Interfaces.IAccountDeletionService, Services.AccountDeletionService>();
        services.AddScoped<Interfaces.IFinanceSecurityService, Services.FinanceSecurityService>();

        return services;
    }
}
