namespace IquitosDelivery.Application.DTOs.Orders;

public class OrderItemDetailResponse
{
    public string ProductName { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal Subtotal { get; set; }
}
