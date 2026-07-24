using IquitosDelivery.Application.DTOs.Notifications;

namespace IquitosDelivery.Application.Interfaces;

public interface IPushNotificationSender
{
    bool IsConfigured { get; }

    string? ConfigurationError { get; }

    Task<PushSendResult> SendToTokenAsync(
        string token,
        string title,
        string body,
        IReadOnlyDictionary<string, string>? data,
        CancellationToken cancellationToken = default);
}
