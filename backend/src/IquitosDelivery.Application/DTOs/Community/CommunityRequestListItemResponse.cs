namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityRequestListItemResponse
{
    public Guid? OrderId { get; set; }

    public string SourceType { get; set; } = string.Empty;

    public Guid Id { get; set; }

    public Guid CreatedByUserId { get; set; }

    public string CreatedByFullName { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string OriginLabel { get; set; } = string.Empty;

    public string DestinationLabel { get; set; } = string.Empty;

    public decimal CompensationAmount { get; set; }

    public decimal EstimatedPurchaseAmount { get; set; }

    public decimal FavorPlatformCommissionAmount { get; set; }

    public decimal CollaboratorEarningAmount { get; set; }

    public decimal TotalClientAmount { get; set; }

    public DateTime? DeadlineUtc { get; set; }

    public string Status { get; set; } = string.Empty;

    public bool IsMine { get; set; }

    public bool IsAssignedToMe { get; set; }

    public decimal MatchScore { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
