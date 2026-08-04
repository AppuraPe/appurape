using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IquitosDelivery.Infrastructure.Email;

public class LoggingEmailSender : IEmailSender
{
    private const string VerificationSubject = "Codigo de verificacion";
    private const string PasswordResetSubject = "Recupera tu contraseña en AppuraPe";

    private readonly IConfiguration _configuration;
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(IConfiguration configuration, ILogger<LoggingEmailSender> logger)
    {
        _configuration = configuration;
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
            MaskEmail(toEmail),
            VerificationSubject,
            GetLoggableCode(code),
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
            MaskEmail(toEmail),
            PasswordResetSubject,
            GetLoggableCode(code),
            expiresInMinutes,
            recipientName);

        return Task.CompletedTask;
    }

    private string GetLoggableCode(string code)
    {
        return _configuration.GetValue<bool>("Email:Logging:RevealCodes")
            ? code
            : "[hidden]";
    }

    private static string MaskEmail(string email)
    {
        var trimmed = email.Trim();
        var atIndex = trimmed.IndexOf('@');
        if (atIndex <= 1)
        {
            return "***";
        }

        var local = trimmed[..atIndex];
        var domain = trimmed[(atIndex + 1)..];
        return $"{local[0]}***@{domain}";
    }
}
