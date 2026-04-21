namespace IquitosDelivery.Application.DTOs.Auth;

public class CompleteCustomerRegistrationRequest
{
    public string Email { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
