using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityRequestQueryRequest
{
    public string? Q { get; set; }

    public CommunityRequestStatus? Status { get; set; }

    public CommunityRequestType? Type { get; set; }

    public bool Mine { get; set; }
}
