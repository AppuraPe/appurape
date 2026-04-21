namespace IquitosDelivery.Application.DTOs.Auth;

public class VerificationStatusResponse
{
    public string Email { get; set; } = string.Empty;

    public bool IsVerified { get; set; }

    public string Message { get; set; } = string.Empty;
}
