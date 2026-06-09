using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace IquitosDelivery.Infrastructure.Email;

public class LoggingEmailSender : IEmailSender
{
    private const string VerificationSubject = "Codigo de verificacion";
    private const string PasswordResetSubject = "Recupera tu contraseña en AppuraPe";

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

    public Task SendPasswordResetCodeAsync(
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
            PasswordResetCode: {Code}
            ExpiresInMinutes: {ExpiresInMinutes}
            RecipientName: {RecipientName}
            Note: Usa este codigo para actualizar tu contraseña. Si no hiciste esta solicitud, ignora este mensaje.
            """,
            toEmail,
            PasswordResetSubject,
            code,
            expiresInMinutes,
            recipientName);

        return Task.CompletedTask;
    }
}
