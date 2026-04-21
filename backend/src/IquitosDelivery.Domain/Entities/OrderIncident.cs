using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class OrderIncident : BaseEntity
{
    public Guid OrderId { get; set; }

    public Order Order { get; set; } = null!;

    public string Type { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}
