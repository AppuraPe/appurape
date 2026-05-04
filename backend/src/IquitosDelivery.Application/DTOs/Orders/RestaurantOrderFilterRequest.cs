using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Orders;

public class RestaurantOrderFilterRequest
{
    public string? Q { get; set; }

    public OrderStatus? Status { get; set; }
}
