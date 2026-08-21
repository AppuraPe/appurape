namespace IquitosDelivery.Application.DTOs.Auth;

public class VerifyPhoneOtpRequest
{
    public string Phone { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string Purpose { get; set; } = "Registration";
}
