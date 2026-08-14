namespace IquitosDelivery.Domain.Enums;

public enum FinancialObligationStatus
{
    Pending = 0,
    Available = 1,
    InSettlement = 2,
    Settled = 3,
    Cancelled = 4,
    Reversed = 5,
    LegacyReconciliationPending = 6
}
