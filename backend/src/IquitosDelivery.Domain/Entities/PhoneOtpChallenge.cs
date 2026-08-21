using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class PhoneOtpChallenge : BaseEntity
{
    public string PhoneNormalized { get; set; } = string.Empty;

    public string Purpose { get; set; } = string.Empty;

    public string CodeHash { get; set; } = string.Empty;

    public DateTime CodeExpiresAtUtc { get; set; }

    public bool IsVerified { get; set; }

    public DateTime? VerifiedAtUtc { get; set; }

    public bool IsCompleted { get; set; }

    public int SendCount { get; set; }

    public int VerifyAttempts { get; set; }

    public DateTime? LastSentAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public string Channel { get; set; } = "WhatsApp";

    public string? ProviderMessageId { get; set; }
}
