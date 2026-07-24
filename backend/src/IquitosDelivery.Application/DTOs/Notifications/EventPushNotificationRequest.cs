namespace IquitosDelivery.Application.DTOs.Notifications;

public class EventPushNotificationRequest
{
    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public IReadOnlyDictionary<string, string>? Data { get; set; }
}
