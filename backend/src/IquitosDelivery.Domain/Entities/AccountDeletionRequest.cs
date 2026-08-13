using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class AccountDeletionRequest : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public AccountDeletionStatus Status { get; set; }
    public UserStatus PreviousUserStatus { get; set; }
    public string VerificationCodeHash { get; set; } = string.Empty;
    public DateTime CodeExpiresAtUtc { get; set; }
    public DateTime? ConfirmedAtUtc { get; set; }
    public DateTime? ScheduledForUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}
