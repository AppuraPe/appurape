namespace IquitosDelivery.Application.DTOs.Orders;

public class OrderItemDetailResponse
{
    public string ProductName { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal Subtotal { get; set; }
}
