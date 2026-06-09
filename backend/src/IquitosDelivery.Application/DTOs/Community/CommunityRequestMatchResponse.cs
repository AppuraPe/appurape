namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityRequestMatchResponse
{
    public Guid CollaboratorId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string AvailabilityStatus { get; set; } = string.Empty;

    public bool IsAvailable { get; set; }

    public decimal? CurrentLatitude { get; set; }

    public decimal? CurrentLongitude { get; set; }

    public decimal AvailabilityRadiusKm { get; set; }

    public decimal TrustScore { get; set; }

    public int CompletedCollaborations { get; set; }

    public decimal CollaborationRating { get; set; }

    public decimal CommunityAcceptanceRate { get; set; }

    public decimal CommunityCancellationRate { get; set; }

    public string CollaborationLevel { get; set; } = string.Empty;

    public bool HasRouteMatch { get; set; }

    public decimal DistanceKm { get; set; }

    public int EstimatedMinutes { get; set; }

    public decimal MatchScore { get; set; }

    public Guid? ExistingApplicationId { get; set; }

    public string? ApplicationStatus { get; set; }
}
