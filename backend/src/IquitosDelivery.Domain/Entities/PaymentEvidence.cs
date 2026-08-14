using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class PaymentEvidence : BaseEntity
{
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;
    public PaymentMethod Method { get; set; }
    public string OperationNumber { get; set; } = string.Empty;
    public decimal DeclaredAmount { get; set; }
    public DateTime PaidAtUtc { get; set; }
    public string PrivateObjectPath { get; set; } = string.Empty;
    public string ContentSha256 { get; set; } = string.Empty;
    public Guid SubmittedByUserId { get; set; }
    public User SubmittedByUser { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public string? DuplicateOverrideReason { get; set; }
    public Guid? DuplicateOverrideByAdminId { get; set; }
}
