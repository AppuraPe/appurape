namespace IquitosDelivery.Application.DTOs.Orders;

public class RestaurantOrderListItemResponse
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Total { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
}
