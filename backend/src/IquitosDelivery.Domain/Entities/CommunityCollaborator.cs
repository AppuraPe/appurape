using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class CommunityCollaborator
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public bool IsAvailable { get; set; }

    public CommunityAvailabilityStatus AvailabilityStatus { get; set; }

    public decimal? CurrentLatitude { get; set; }

    public decimal? CurrentLongitude { get; set; }

    public decimal AvailabilityRadiusKm { get; set; }

    public DateTime? AvailableFromUtc { get; set; }

    public DateTime? AvailableUntilUtc { get; set; }

    public decimal TrustScore { get; set; }

    public int CompletedCollaborations { get; set; }

    public decimal CollaborationRating { get; set; }

    public decimal CommunityAcceptanceRate { get; set; }

    public decimal CommunityCancellationRate { get; set; }

    public CommunityCollaborationLevel CollaborationLevel { get; set; }

    public ICollection<CommunityRoute> Routes { get; set; } = new List<CommunityRoute>();

    public ICollection<CommunityRequest> AssignedRequests { get; set; } = new List<CommunityRequest>();

    public ICollection<CommunityRequestApplication> Applications { get; set; } = new List<CommunityRequestApplication>();
}
