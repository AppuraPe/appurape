namespace IquitosDelivery.Domain.Enums;

public enum FinancialReconciliationStatus
{
    Current = 0,
    LegacyReconciliationPending = 1,
    Recognized = 2,
    Cancelled = 3,
    ConvertedToObligation = 4
}
