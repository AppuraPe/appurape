using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class FinancialAuditEvent : BaseEntity
{
    public Guid ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? IdempotencyKey { get; set; }
    public string DataJson { get; set; } = "{}";
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
