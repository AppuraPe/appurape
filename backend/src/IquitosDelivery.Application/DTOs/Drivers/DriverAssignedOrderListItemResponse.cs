namespace IquitosDelivery.Application.DTOs.Drivers;

public class DriverAssignedOrderListItemResponse
{
    public Guid Id { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Total { get; set; }

    public string DeliveryAddress { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ReadyAtUtc { get; set; }

    public DateTime? PickedUpAtUtc { get; set; }
}
