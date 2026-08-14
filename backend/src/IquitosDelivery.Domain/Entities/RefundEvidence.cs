using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class RefundEvidence : BaseEntity
{
    public Guid RefundRequestId { get; set; }
    public RefundRequest RefundRequest { get; set; } = null!;
    public string OperationNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime RefundedAtUtc { get; set; }
    public string PrivateObjectPath { get; set; } = string.Empty;
    public string ContentSha256 { get; set; } = string.Empty;
    public Guid SubmittedByUserId { get; set; }
}
