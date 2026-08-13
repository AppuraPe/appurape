namespace IquitosDelivery.Application.DTOs.Account;

public sealed class StartAccountDeletionRequest { public string Email { get; set; } = string.Empty; }
public sealed class ConfirmAccountDeletionRequest { public string Email { get; set; } = string.Empty; public string Code { get; set; } = string.Empty; }
public sealed class AccountDeletionStatusResponse
{
    public string Status { get; set; } = "None";
    public DateTime? ScheduledForUtc { get; set; }
    public bool CanCancel { get; set; }
}
