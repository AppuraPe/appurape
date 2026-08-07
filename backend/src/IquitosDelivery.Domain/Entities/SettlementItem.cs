using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class SettlementItem : BaseEntity
{
    public Guid SettlementBatchId { get; set; }

    public SettlementBatch SettlementBatch { get; set; } = null!;

    public Guid FinancialMovementId { get; set; }

    public FinancialMovement FinancialMovement { get; set; } = null!;

    public decimal GrossAmount { get; set; }

    public decimal CommissionAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal NetAmount { get; set; }
}
