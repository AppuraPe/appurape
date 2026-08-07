namespace IquitosDelivery.Application.DTOs.Finance;

public class SettlementItemResponse
{
    public Guid Id { get; set; }

    public Guid FinancialMovementId { get; set; }

    public string MovementType { get; set; } = string.Empty;

    public decimal GrossAmount { get; set; }

    public decimal CommissionAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal NetAmount { get; set; }
}
