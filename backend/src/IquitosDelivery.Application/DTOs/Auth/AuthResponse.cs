namespace IquitosDelivery.Application.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;

    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string PrimaryRole { get; set; } = string.Empty;

    public string ActiveProfile { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? TrustLevel { get; set; }

    public decimal? TrustScore { get; set; }

    public string? CommunityCollaborationLevel { get; set; }

    public decimal? CommunityTrustScore { get; set; }

    public string? CommunityAvailabilityStatus { get; set; }

    public bool? IsCommunityAvailable { get; set; }

    public bool HasCustomerProfile { get; set; }

    public bool HasBusinessProfile { get; set; }

    public bool HasDriverProfile { get; set; }

    public bool HasCollaboratorProfile { get; set; }

    public string? CollaboratorApprovalStatus { get; set; }

    public bool? IsCollaboratorIdentityVerified { get; set; }

    public string[] AvailableProfiles { get; set; } = Array.Empty<string>();
}
