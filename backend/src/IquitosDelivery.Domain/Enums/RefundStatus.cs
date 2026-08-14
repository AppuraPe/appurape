namespace IquitosDelivery.Domain.Enums;

public enum RefundStatus
{
    Requested = 0,
    AwaitingBusinessRefund = 1,
    AwaitingCustomerConfirmation = 2,
    Completed = 3,
    Disputed = 4,
    Rejected = 5,
    Failed = 6
}
