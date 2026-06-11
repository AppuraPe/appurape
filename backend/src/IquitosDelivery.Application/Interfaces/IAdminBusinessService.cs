namespace IquitosDelivery.Application.Interfaces;

public interface IAdminBusinessService
{
    Task<IReadOnlyList<AdminBusinessListItemResponse>> GetBusinessesAsync(AdminBusinessFilterRequest filters, CancellationToken cancellationToken = default);

    Task<AdminBusinessDetailResponse> GetBusinessByIdAsync(Guid businessId, CancellationToken cancellationToken = default);

    Task<AdminBusinessDetailResponse> UpdateBusinessStatusAsync(Guid businessId, UpdateBusinessStatusRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PendingBusinessResponse>> GetPendingBusinessesAsync(CancellationToken cancellationToken = default);

    Task<PendingBusinessResponse> ApproveBusinessAsync(Guid businessId, CancellationToken cancellationToken = default);

    Task<PendingBusinessResponse> RejectBusinessAsync(Guid businessId, CancellationToken cancellationToken = default);
}
