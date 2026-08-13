using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class OrderDeliveryConfirmationAudit : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid ActorUserId { get; set; }
    public User ActorUser { get; set; } = null!;
    public string Action { get; set; } = string.Empty;
    public int CodeVersion { get; set; }
    public string? Reason { get; set; }
}
