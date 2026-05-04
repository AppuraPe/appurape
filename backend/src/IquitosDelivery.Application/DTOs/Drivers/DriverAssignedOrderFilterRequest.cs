using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Drivers;

public class DriverAssignedOrderFilterRequest
{
    public string? Q { get; set; }

    public OrderStatus? Status { get; set; }
}
