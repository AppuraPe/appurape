namespace IquitosDelivery.Application.DTOs.Orders;

public class CustomerOrderListItemResponse
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal Total { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
}
