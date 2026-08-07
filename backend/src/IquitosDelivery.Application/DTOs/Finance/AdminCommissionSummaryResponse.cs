namespace IquitosDelivery.Application.DTOs.Finance;

public class AdminCommissionSummaryResponse
{
    public decimal PendingAmount { get; set; }

    public decimal AvailableAmount { get; set; }

    public decimal SettledAmount { get; set; }

    public decimal CashDebtAmount { get; set; }

    public int PendingCount { get; set; }

    public int AvailableCount { get; set; }

    public int CashDebtCount { get; set; }
}
