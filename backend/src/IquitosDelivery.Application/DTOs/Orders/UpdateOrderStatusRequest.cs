using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Orders;

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
}
