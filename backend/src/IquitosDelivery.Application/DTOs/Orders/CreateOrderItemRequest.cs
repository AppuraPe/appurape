namespace IquitosDelivery.Application.DTOs.Orders;

public class CreateOrderItemRequest
{
    public Guid MenuItemId { get; set; }

    public int Quantity { get; set; }
}
