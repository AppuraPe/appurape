using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.DTOs.Businesses;

namespace IquitosDelivery.Application.Services;

public class BusinessServiceAdapter : IBusinessService
{
    private readonly IRestaurantService _restaurantService;

    public BusinessServiceAdapter(IRestaurantService restaurantService)
    {
        _restaurantService = restaurantService;
    }

    public Task<IReadOnlyList<BusinessListItemResponse>> GetPublicBusinessesAsync(
        PublicBusinessFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        return _restaurantService.GetPublicRestaurantsAsync(filters, cancellationToken);
    }

    public Task<PublicBusinessMobileHomeResponse> GetPublicBusinessMobileHomeAsync(CancellationToken cancellationToken = default)
    {
        return _restaurantService.GetPublicBusinessMobileHomeAsync(cancellationToken);
    }

    public Task<BusinessDetailResponse> GetPublicBusinessDetailAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return _restaurantService.GetPublicRestaurantDetailAsync(businessId, cancellationToken);
    }

    public Task<MyBusinessResponse> GetMyBusinessAsync(CancellationToken cancellationToken = default)
    {
        return _restaurantService.GetMyRestaurantAsync(cancellationToken);
    }

    public Task<MyBusinessResponse> UpdateMyBusinessAsync(UpdateMyBusinessRequest request, CancellationToken cancellationToken = default)
    {
        return _restaurantService.UpdateMyRestaurantAsync(request, cancellationToken);
    }

    public Task<MyBusinessResponse> UpdateMyBusinessActivationAsync(UpdateBusinessActivationRequest request, CancellationToken cancellationToken = default)
    {
        return _restaurantService.UpdateMyRestaurantActivationAsync(request, cancellationToken);
    }
}
