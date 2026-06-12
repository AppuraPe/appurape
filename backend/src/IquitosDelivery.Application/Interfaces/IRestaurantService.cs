using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.DTOs.Businesses;

namespace IquitosDelivery.Application.Interfaces;

public interface IRestaurantService
{
    Task<IReadOnlyList<RestaurantListItemResponse>> GetPublicRestaurantsAsync(
        PublicRestaurantFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<PublicBusinessMobileHomeResponse> GetPublicBusinessMobileHomeAsync(CancellationToken cancellationToken = default);

    Task<RestaurantDetailResponse> GetPublicRestaurantDetailAsync(Guid restaurantId, CancellationToken cancellationToken = default);

    Task<MyRestaurantResponse> GetMyRestaurantAsync(CancellationToken cancellationToken = default);

    Task<MyRestaurantResponse> UpdateMyRestaurantAsync(UpdateMyRestaurantRequest request, CancellationToken cancellationToken = default);

    Task<MyRestaurantResponse> UpdateMyRestaurantActivationAsync(UpdateRestaurantActivationRequest request, CancellationToken cancellationToken = default);
}
