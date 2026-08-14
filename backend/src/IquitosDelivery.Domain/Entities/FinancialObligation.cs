using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class FinancialObligation : BaseEntity
{
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid? CommunityRequestId { get; set; }
    public CommunityRequest? CommunityRequest { get; set; }
    public Guid? RefundRequestId { get; set; }
    public RefundRequest? RefundRequest { get; set; }
    public FinancialPartyType DebtorType { get; set; }
    public Guid? DebtorEntityId { get; set; }
    public FinancialPartyType CreditorType { get; set; }
    public Guid? CreditorEntityId { get; set; }
    public FinancialObligationConcept Concept { get; set; }
    public FinancialObligationStatus Status { get; set; }
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "PEN";
    public DateTime? DueAtUtc { get; set; }
    public DateTime? AvailableAtUtc { get; set; }
    public DateTime? SettledAtUtc { get; set; }
    public string SnapshotJson { get; set; } = "{}";
    public string Reference { get; set; } = string.Empty;
    public Guid? ReversalOfId { get; set; }
    public FinancialObligation? ReversalOf { get; set; }
    public uint Version { get; set; }
}
