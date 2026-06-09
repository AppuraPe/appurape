namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityAdminCollaboratorRankingResponse
{
    public Guid CollaboratorId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string AvailabilityStatus { get; set; } = string.Empty;

    public string CollaborationLevel { get; set; } = string.Empty;

    public decimal TrustScore { get; set; }

    public decimal CollaborationRating { get; set; }

    public int CompletedCollaborations { get; set; }

    public decimal MatchScore { get; set; }
}
