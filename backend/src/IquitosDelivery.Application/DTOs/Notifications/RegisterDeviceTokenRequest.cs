namespace IquitosDelivery.Application.DTOs.Notifications;

public class RegisterDeviceTokenRequest
{
    public string Token { get; set; } = string.Empty;

    public string Platform { get; set; } = string.Empty;

    public string? DeviceId { get; set; }

    public string? AppVersion { get; set; }
}
