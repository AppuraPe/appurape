using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class PasswordResetRequest : BaseEntity
{
    public string Email { get; set; } = string.Empty;

    public string CodeHash { get; set; } = string.Empty;

    public DateTime CodeExpiresAtUtc { get; set; }

    public int SendCount { get; set; }

    public int VerifyAttempts { get; set; }

    public DateTime? LastSentAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public bool IsCompleted { get; set; }
}
