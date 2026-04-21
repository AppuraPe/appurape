using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace IquitosDelivery.Infrastructure.Email;

public class LoggingEmailSender : IEmailSender
{
    private const string VerificationSubject = "Codigo de verificacion";

    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendVerificationCodeAsync(
        string toEmail,
        string recipientName,
        string code,
        int expiresInMinutes,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            """
            Development email sender active.
            To: {Email}
            Subject: {Subject}
            VerificationCode: {Code}
            ExpiresInMinutes: {ExpiresInMinutes}
            RecipientName: {RecipientName}
            """,
            toEmail,
            VerificationSubject,
            code,
            expiresInMinutes,
            recipientName);

        return Task.CompletedTask;
    }
}
