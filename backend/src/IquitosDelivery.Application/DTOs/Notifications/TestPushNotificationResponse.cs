namespace IquitosDelivery.Application.DTOs.Notifications;

public class TestPushNotificationResponse
{
    public int TokensFound { get; set; }

    public int SentOk { get; set; }

    public int Failed { get; set; }

    public int Deactivated { get; set; }

    public string Message { get; set; } = string.Empty;
}
