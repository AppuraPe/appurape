using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminCommunityService
{
    Task<CommunityAdminOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CommunityCollaboratorResponse>> GetCollaboratorsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CommunityRequestListItemResponse>> GetRequestsAsync(CancellationToken cancellationToken = default);
}
