namespace IquitosDelivery.Application.DTOs.Drivers;

public class AvailableDriverOrderListItemResponse
{
    public Guid Id { get; set; }

    public string OrderCode { get; set; } = string.Empty;

    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public string PickupAddress { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string DeliveryAddress { get; set; } = string.Empty;

    public string DeliveryReference { get; set; } = string.Empty;

    public decimal CourierEarningAmount { get; set; }

    public string DeliveryMode { get; set; } = string.Empty;

    public decimal DeliveryFee { get; set; }

    public decimal DeliveryMinimumAmount { get; set; }

    public decimal Total { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public Guid? AssignedCourierUserId { get; set; }

    public string? AssignedCourierType { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ReadyAtUtc { get; set; }
}
