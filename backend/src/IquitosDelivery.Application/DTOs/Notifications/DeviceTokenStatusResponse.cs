namespace IquitosDelivery.Application.DTOs.Notifications;

public class DeviceTokenStatusResponse
{
    public int ActiveTokens { get; set; }

    public int InactiveTokens { get; set; }

    public string[] Platforms { get; set; } = Array.Empty<string>();
}
