using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class CollaboratorVerification : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public CollaboratorVerificationStatus Status { get; set; }

    public decimal VerificationFeeAmount { get; set; }

    public Guid? PaymentId { get; set; }

    public Payment? Payment { get; set; }

    public DateTime SubmittedAtUtc { get; set; }

    public DateTime? ReviewedAtUtc { get; set; }

    public Guid? ReviewedByAdminId { get; set; }

    public User? ReviewedByAdmin { get; set; }

    public string? RejectReason { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }
}
