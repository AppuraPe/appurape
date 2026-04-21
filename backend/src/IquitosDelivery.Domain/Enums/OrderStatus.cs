namespace IquitosDelivery.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Accepted = 1,
    Preparing = 2,
    ReadyForPickup = 3,
    Assigned = 4,
    PickedUp = 5,
    OnTheWay = 6,
    Delivered = 7,
    Cancelled = 8
}
