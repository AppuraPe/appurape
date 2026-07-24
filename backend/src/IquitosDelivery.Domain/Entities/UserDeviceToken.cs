using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class UserDeviceToken : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public UserRole Role { get; set; }

    public string Token { get; set; } = string.Empty;

    public string Platform { get; set; } = string.Empty;

    public string? DeviceId { get; set; }

    public string? AppVersion { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime LastSeenAtUtc { get; set; }
}
