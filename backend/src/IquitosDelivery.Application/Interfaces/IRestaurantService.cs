using IquitosDelivery.Application.DTOs.Restaurants;

namespace IquitosDelivery.Application.Interfaces;

public interface IRestaurantService
{
    Task<IReadOnlyList<RestaurantListItemResponse>> GetPublicRestaurantsAsync(
        PublicRestaurantFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<RestaurantDetailResponse> GetPublicRestaurantDetailAsync(Guid restaurantId, CancellationToken cancellationToken = default);

    Task<MyRestaurantResponse> GetMyRestaurantAsync(CancellationToken cancellationToken = default);

    Task<MyRestaurantResponse> UpdateMyRestaurantAsync(UpdateMyRestaurantRequest request, CancellationToken cancellationToken = default);

    Task<MyRestaurantResponse> UpdateMyRestaurantActivationAsync(UpdateRestaurantActivationRequest request, CancellationToken cancellationToken = default);
}
