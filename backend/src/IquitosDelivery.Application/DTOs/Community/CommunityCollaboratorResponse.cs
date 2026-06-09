namespace IquitosDelivery.Application.DTOs.Community;

public class CommunityCollaboratorResponse
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public bool IsAvailable { get; set; }

    public string AvailabilityStatus { get; set; } = string.Empty;

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

    public string CollaborationLevel { get; set; } = string.Empty;

    public string? CollaboratorApprovalStatus { get; set; }

    public bool IsIdentityVerified { get; set; }

    public bool IsPhoneVerified { get; set; }

    public string? IdentityDocumentNumber { get; set; }

    public string UserStatus { get; set; } = string.Empty;
}
