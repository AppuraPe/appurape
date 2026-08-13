namespace IquitosDelivery.Application.DTOs.Finance;

public class CollaboratorVerificationResponse
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string UserFullName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal VerificationFeeAmount { get; set; }

    public DateTime SubmittedAtUtc { get; set; }

    public DateTime? ReviewedAtUtc { get; set; }

    public Guid? ReviewedByAdminId { get; set; }

    public string? RejectReason { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }

    public bool HasProfilePhoto { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public bool HasIdentityDocument { get; set; }
    public bool HasLiveSelfie { get; set; }
    public DateTime? LiveSelfieCapturedAtUtc { get; set; }
}
