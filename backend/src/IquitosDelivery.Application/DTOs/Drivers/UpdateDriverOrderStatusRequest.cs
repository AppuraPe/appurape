using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Drivers;

public class UpdateDriverOrderStatusRequest
{
    public OrderStatus Status { get; set; }
}
