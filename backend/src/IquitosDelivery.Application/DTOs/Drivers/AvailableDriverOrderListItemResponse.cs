namespace IquitosDelivery.Application.DTOs.Drivers;

public class AvailableDriverOrderListItemResponse
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public string DeliveryAddress { get; set; } = string.Empty;

    public string DeliveryReference { get; set; } = string.Empty;

    public decimal CourierEarningAmount { get; set; }

    public decimal Total { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public Guid? AssignedCourierUserId { get; set; }

    public string? AssignedCourierType { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ReadyAtUtc { get; set; }
}
