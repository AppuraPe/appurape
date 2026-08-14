using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class SettlementBatch : BaseEntity
{
    public SettlementTargetType TargetType { get; set; }

    public Guid? BusinessId { get; set; }

    public Restaurant? Business { get; set; }

    public Guid? DriverId { get; set; }

    public DriverProfile? Driver { get; set; }

    public Guid? CollaboratorUserId { get; set; }

    public User? CollaboratorUser { get; set; }

    public DateTime PeriodStartUtc { get; set; }

    public DateTime PeriodEndUtc { get; set; }

    public decimal GrossAmount { get; set; }

    public decimal CommissionAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal NetAmount { get; set; }

    public SettlementStatus Status { get; set; }

    public DateTime? ConfirmedAtUtc { get; set; }

    public Guid? ConfirmedByAdminId { get; set; }

    public User? ConfirmedByAdmin { get; set; }

    public string? Notes { get; set; }

    public FinancialPartyType? DebtorType { get; set; }

    public Guid? DebtorEntityId { get; set; }

    public FinancialPartyType? CreditorType { get; set; }

    public Guid? CreditorEntityId { get; set; }

    public Guid? CreatedByAdminId { get; set; }

    public Guid? ApprovedByAdminId { get; set; }

    public DateTime? ApprovedAtUtc { get; set; }

    public Guid? PaymentReportedByAdminId { get; set; }

    public DateTime? PaymentReportedAtUtc { get; set; }

    public string? PaymentOperationNumber { get; set; }

    public string? PaymentEvidenceObjectPath { get; set; }

    public string? PaymentEvidenceSha256 { get; set; }

    public uint Version { get; set; }

    public ICollection<SettlementItem> Items { get; set; } = new List<SettlementItem>();
}
