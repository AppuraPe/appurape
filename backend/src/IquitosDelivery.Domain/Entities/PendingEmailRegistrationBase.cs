using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public abstract class PendingEmailRegistrationBase : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? PhoneNormalized { get; set; }

    public string Email { get; set; } = string.Empty;

    public string IdentityDocumentType { get; set; } = "DNI";

    public string IdentityDocumentNumber { get; set; } = string.Empty;

    public string? IdentityDocumentNumberNormalized { get; set; }

    public string VerificationCodeHash { get; set; } = string.Empty;

    public DateTime CodeExpiresAtUtc { get; set; }

    public bool IsVerified { get; set; }

    public DateTime? VerifiedAtUtc { get; set; }

    public bool IsCompleted { get; set; }

    public int SendCount { get; set; }

    public int VerifyAttempts { get; set; }

    public DateTime? LastSentAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }
}
