using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Community;

public class CreateCommunityRequestRequest
{
    public CommunityRequestType Type { get; set; }

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

    public DateTime? DeadlineUtc { get; set; }
}
