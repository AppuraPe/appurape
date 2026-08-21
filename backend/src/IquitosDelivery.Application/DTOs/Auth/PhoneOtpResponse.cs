namespace IquitosDelivery.Application.DTOs.Auth;

public class PhoneOtpResponse
{
    public string PhoneMasked { get; set; } = string.Empty;

    public string Purpose { get; set; } = string.Empty;

    public string Channel { get; set; } = "WhatsApp";

    public int ExpiresInMinutes { get; set; }

    public string Message { get; set; } = string.Empty;
}
