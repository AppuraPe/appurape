namespace IquitosDelivery.Domain.Enums;

public enum PaymentStatus
{
    Pending = 0,
    PendingConfirmation = 1,
    Paid = 2,
    Rejected = 3,
    Failed = 4,
    Refunded = 5
}
