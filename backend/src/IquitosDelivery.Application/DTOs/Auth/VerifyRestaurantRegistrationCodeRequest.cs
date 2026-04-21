namespace IquitosDelivery.Application.DTOs.Auth;

public class VerifyRestaurantRegistrationCodeRequest
{
    public string Email { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;
}
