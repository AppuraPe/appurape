namespace IquitosDelivery.Application.DTOs.Auth;

public class StartPhoneOtpRequest
{
    public string Phone { get; set; } = string.Empty;

    public string Purpose { get; set; } = "Registration";
}
