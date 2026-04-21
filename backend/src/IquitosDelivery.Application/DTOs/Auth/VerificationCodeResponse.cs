namespace IquitosDelivery.Application.DTOs.Auth;

public class VerificationCodeResponse
{
    public string Message { get; set; } = string.Empty;

    public int ExpiresInMinutes { get; set; }

    public string Email { get; set; } = string.Empty;
}
