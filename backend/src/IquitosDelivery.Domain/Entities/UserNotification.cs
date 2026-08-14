using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class UserNotification : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string? EventType { get; set; }

    public string? TargetRoute { get; set; }

    public string? DataJson { get; set; }

    public DateTime? ReadAtUtc { get; set; }
}
