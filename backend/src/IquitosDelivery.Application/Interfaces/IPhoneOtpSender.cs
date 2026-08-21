namespace IquitosDelivery.Application.Interfaces;

public interface IPhoneOtpSender
{
    Task<PhoneOtpSendResult> SendAsync(string phoneNormalized, string code, int expirationMinutes, CancellationToken cancellationToken = default);
}

public class PhoneOtpSendResult
{
    public bool Sent { get; init; }

    public string Channel { get; init; } = "WhatsApp";

    public string? ProviderMessageId { get; init; }

    public string? ErrorMessage { get; init; }
}
