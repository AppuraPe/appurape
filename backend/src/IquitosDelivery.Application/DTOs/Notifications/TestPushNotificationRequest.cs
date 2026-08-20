namespace IquitosDelivery.Application.DTOs.Notifications;

public class TestPushNotificationRequest
{
    public string? Title { get; set; }

    public string? Body { get; set; }

    public IReadOnlyDictionary<string, string>? Data { get; set; }

    public bool PersistToInbox { get; set; }
}
