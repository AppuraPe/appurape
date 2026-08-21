using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Interfaces;

public interface ICommunityService
{
    Task<CommunityCollaboratorResponse> GetMyCollaboratorProfileAsync(CancellationToken cancellationToken = default);

    Task<CommunityCollaboratorResponse> UpdateMyCollaboratorProfileAsync(UpdateCommunityCollaboratorRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CommunityRouteResponse>> GetMyRoutesAsync(CancellationToken cancellationToken = default);

    Task<CommunityRouteResponse> UpsertMyRouteAsync(Guid? routeId, UpsertCommunityRouteRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CommunityRequestListItemResponse>> GetRequestsAsync(CommunityRequestQueryRequest request, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> GetRequestByIdAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestQuoteResponse> QuoteRequestAsync(CreateCommunityRequestRequest request, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> CreateRequestAsync(CreateCommunityRequestRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CommunityRequestMatchResponse>> GetRequestMatchesAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> ApplyToRequestAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> SelectApplicationAsync(Guid requestId, SelectCommunityRequestApplicationRequest request, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> AcceptRequestAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> StartRequestAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> CompleteRequestAsync(Guid requestId, CompleteCommunityRequestRequest request, string? proofImageUrl, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> ConfirmRequestAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> RegenerateConfirmationCodeAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> CancelRequestAsync(Guid requestId, CancelCommunityRequestRequest request, CancellationToken cancellationToken = default);

    Task<CommunityRequestDetailResponse> RateCollaboratorAsync(Guid requestId, RateCommunityCollaboratorRequest request, CancellationToken cancellationToken = default);
}
