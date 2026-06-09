namespace IquitosDelivery.Application.Interfaces;

public interface IEmailSender
{
    Task SendVerificationCodeAsync(
        string toEmail,
        string recipientName,
        string code,
        int expiresInMinutes,
        CancellationToken cancellationToken = default);

    Task SendPasswordResetCodeAsync(
        string toEmail,
        string recipientName,
        string code,
        int expiresInMinutes,
        CancellationToken cancellationToken = default);
}
