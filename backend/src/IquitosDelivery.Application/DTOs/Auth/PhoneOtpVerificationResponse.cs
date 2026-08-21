namespace IquitosDelivery.Application.DTOs.Auth;

public class PhoneOtpVerificationResponse
{
    public string PhoneMasked { get; set; } = string.Empty;

    public string Purpose { get; set; } = string.Empty;

    public bool IsVerified { get; set; }

    public string Message { get; set; } = string.Empty;
}
