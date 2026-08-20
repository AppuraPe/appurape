namespace IquitosDelivery.Api.Controllers.Requests.Notifications;

public class TestPushNotificationRequest
{
    public string? Title { get; set; }

    public string? Body { get; set; }

    public Dictionary<string, string>? Data { get; set; }

    public bool PersistToInbox { get; set; }
}
