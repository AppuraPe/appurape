using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Orders;

public class CreateOrderRequest
{
    public Guid RestaurantId { get; set; }

    public Guid ZoneId { get; set; }

    public string DeliveryAddress { get; set; } = string.Empty;

    public string DeliveryReference { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public List<CreateOrderItemRequest> Items { get; set; } = new();
}
