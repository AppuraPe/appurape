using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class SettlementItem : BaseEntity
{
    public bool IsActive { get; set; } = true;

    public Guid SettlementBatchId { get; set; }

    public SettlementBatch SettlementBatch { get; set; } = null!;

    public Guid? FinancialMovementId { get; set; }

    public FinancialMovement? FinancialMovement { get; set; }

    public Guid? FinancialObligationId { get; set; }

    public FinancialObligation? FinancialObligation { get; set; }

    public decimal GrossAmount { get; set; }

    public decimal CommissionAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal NetAmount { get; set; }
}
