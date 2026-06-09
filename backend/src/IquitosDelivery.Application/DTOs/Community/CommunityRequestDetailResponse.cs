namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityRequestDetailResponse
{
    public Guid Id { get; set; }

    public Guid CreatedByUserId { get; set; }

    public string CreatedByFullName { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string OriginLabel { get; set; } = string.Empty;

    public decimal? OriginLatitude { get; set; }

    public decimal? OriginLongitude { get; set; }

    public string DestinationLabel { get; set; } = string.Empty;

    public decimal? DestinationLatitude { get; set; }

    public decimal? DestinationLongitude { get; set; }

    public decimal CompensationAmount { get; set; }

    public decimal EstimatedPurchaseAmount { get; set; }

    public decimal FavorPlatformCommissionAmount { get; set; }

    public decimal CollaboratorEarningAmount { get; set; }

    public decimal TotalClientAmount { get; set; }

    public decimal PlatformRevenueAmount { get; set; }

    public DateTime? DeadlineUtc { get; set; }

    public string Status { get; set; } = string.Empty;

    public Guid? AssignedCollaboratorId { get; set; }

    public string? AssignedCollaboratorName { get; set; }

    public Guid? AssignedRouteId { get; set; }

    public decimal MatchScore { get; set; }

    public string? ConfirmationCode { get; set; }

    public string? ProofImageUrl { get; set; }

    public int? CollaboratorRating { get; set; }

    public string? CollaboratorFeedback { get; set; }

    public DateTime? AcceptedAtUtc { get; set; }

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? DeliveredAtUtc { get; set; }

    public DateTime? ClientConfirmedAtUtc { get; set; }

    public DateTime? CancelledAtUtc { get; set; }

    public string? CancellationReason { get; set; }

    public List<CommunityRequestApplicationResponse> Applications { get; set; } = new();

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}
