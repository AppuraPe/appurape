using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class CollaboratorProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public ApprovalStatus ApprovalStatus { get; set; }

    public bool IsIdentityVerified { get; set; }

    public bool IsPhoneVerified { get; set; }

    public string? IdentityDocumentNumber { get; set; }

    public string? IdentityDocumentUrl { get; set; }

    public string? ProfilePhotoUrl { get; set; }

    public string? LiveSelfieUrl { get; set; }

    public DateTime? LiveSelfieCapturedAtUtc { get; set; }

    public string? Notes { get; set; }
}
