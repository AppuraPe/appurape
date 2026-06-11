using IquitosDelivery.Application.Interfaces;

namespace IquitosDelivery.Application.Services;

public class AdminBusinessServiceAdapter : IAdminBusinessService
{
    private readonly IAdminRestaurantService _adminRestaurantService;

    public AdminBusinessServiceAdapter(IAdminRestaurantService adminRestaurantService)
    {
        _adminRestaurantService = adminRestaurantService;
    }

    public Task<IReadOnlyList<AdminBusinessListItemResponse>> GetBusinessesAsync(AdminBusinessFilterRequest filters, CancellationToken cancellationToken = default)
    {
        return _adminRestaurantService.GetRestaurantsAsync(filters, cancellationToken);
    }

    public Task<AdminBusinessDetailResponse> GetBusinessByIdAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return _adminRestaurantService.GetRestaurantByIdAsync(businessId, cancellationToken);
    }

    public Task<AdminBusinessDetailResponse> UpdateBusinessStatusAsync(Guid businessId, UpdateBusinessStatusRequest request, CancellationToken cancellationToken = default)
    {
        return _adminRestaurantService.UpdateRestaurantStatusAsync(businessId, request, cancellationToken);
    }

    public Task<IReadOnlyList<PendingBusinessResponse>> GetPendingBusinessesAsync(CancellationToken cancellationToken = default)
    {
        return _adminRestaurantService.GetPendingRestaurantsAsync(cancellationToken);
    }

    public Task<PendingBusinessResponse> ApproveBusinessAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return _adminRestaurantService.ApproveRestaurantAsync(businessId, cancellationToken);
    }

    public Task<PendingBusinessResponse> RejectBusinessAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return _adminRestaurantService.RejectRestaurantAsync(businessId, cancellationToken);
    }
}
