namespace IquitosDelivery.Application.DTOs.Auth;

public class VerifyCustomerRegistrationCodeRequest
{
    public string Email { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;
}
