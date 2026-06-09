namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityAdminOverviewResponse
{
    public int ActiveCollaboratorsCount { get; set; }

    public int AvailableCollaboratorsCount { get; set; }

    public int PublishedRequestsCount { get; set; }

    public int AcceptedRequestsCount { get; set; }

    public int InProcessRequestsCount { get; set; }

    public int DeliveredRequestsCount { get; set; }

    public int CancelledRequestsCount { get; set; }

    public decimal SuccessRate { get; set; }

    public decimal AverageTrustScore { get; set; }

    public IReadOnlyList<CommunityAdminCollaboratorRankingResponse> TopCollaborators { get; set; } = Array.Empty<CommunityAdminCollaboratorRankingResponse>();
}
