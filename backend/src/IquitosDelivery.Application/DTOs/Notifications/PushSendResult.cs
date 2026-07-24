namespace IquitosDelivery.Application.DTOs.Notifications;

public class PushSendResult
{
    public bool IsSuccess { get; set; }

    public bool ShouldDeactivateToken { get; set; }

    public bool IsConfigurationError { get; set; }

    public string? ProviderMessageId { get; set; }

    public string? ErrorCode { get; set; }

    public string? ErrorMessage { get; set; }
}
