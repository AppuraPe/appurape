using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Restaurants;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminRestaurantService
{
    Task<IReadOnlyList<AdminRestaurantListItemResponse>> GetRestaurantsAsync(AdminRestaurantFilterRequest filters, CancellationToken cancellationToken = default);

    Task<AdminRestaurantDetailResponse> GetRestaurantByIdAsync(Guid restaurantId, CancellationToken cancellationToken = default);

    Task<AdminRestaurantDetailResponse> UpdateRestaurantStatusAsync(Guid restaurantId, UpdateAdminEntityStatusRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PendingRestaurantResponse>> GetPendingRestaurantsAsync(CancellationToken cancellationToken = default);

    Task<PendingRestaurantResponse> ApproveRestaurantAsync(Guid restaurantId, CancellationToken cancellationToken = default);

    Task<PendingRestaurantResponse> RejectRestaurantAsync(Guid restaurantId, CancellationToken cancellationToken = default);
}
