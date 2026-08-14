using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class RefundRequest : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;
    public RefundStatus Status { get; set; }
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "PEN";
    public string Reason { get; set; } = string.Empty;
    public Guid RequestedByUserId { get; set; }
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? BusinessReportedAtUtc { get; set; }
    public DateTime? CustomerConfirmedAtUtc { get; set; }
    public DateTime? DisputedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public string? ResolutionReason { get; set; }
    public uint Version { get; set; }
    public ICollection<RefundEvidence> Evidence { get; set; } = new List<RefundEvidence>();
}
