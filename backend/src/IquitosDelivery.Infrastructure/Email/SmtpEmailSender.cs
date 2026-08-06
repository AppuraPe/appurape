using System.Net;
using System.Net.Mail;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Email;

public class SmtpEmailSender : IEmailSender
{
    private const string VerificationSubject = "Código de verificación";
    private const string PasswordResetSubject = "Recupera tu contraseña en AppuraPe";

    private readonly ILogger<SmtpEmailSender> _logger;
    private readonly EmailSettings _settings;
    private readonly EmailTemplateRenderer _templateRenderer;

    public SmtpEmailSender(
        IOptions<EmailSettings> settings,
        EmailTemplateRenderer templateRenderer,
        ILogger<SmtpEmailSender> logger)
    {
        _logger = logger;
        _settings = settings.Value;
        _templateRenderer = templateRenderer;
    }

    public async Task SendVerificationCodeAsync(
        string toEmail,
        string recipientName,
        string code,
        int expiresInMinutes,
        CancellationToken cancellationToken = default)
    {
        try
        {
            EnsureConfigured();

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromAddress, _settings.FromName),
                Subject = VerificationSubject,
                Body = _templateRenderer.RenderVerificationCodeEmail(recipientName, code, expiresInMinutes),
                IsBodyHtml = true
            };

            message.To.Add(toEmail);

            using var client = CreateClient();
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Verification email could not be sent to {Email}.", MaskEmail(toEmail));
            throw exception is AppException appException
                ? appException
                : new AppException("Verification email could not be sent.");
        }
    }

    public async Task SendPasswordResetCodeAsync(
        string toEmail,
        string recipientName,
        string code,
        int expiresInMinutes,
        CancellationToken cancellationToken = default)
    {
        try
        {
            EnsureConfigured();

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromAddress, _settings.FromName),
                Subject = PasswordResetSubject,
                Body = _templateRenderer.RenderPasswordResetEmail(recipientName, code, expiresInMinutes),
                IsBodyHtml = true
            };

            message.To.Add(toEmail);

            using var client = CreateClient();
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Password reset email could not be sent to {Email}.", MaskEmail(toEmail));
            throw exception is AppException appException
                ? appException
                : new AppException("Password reset email could not be sent.");
        }
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost) || string.IsNullOrWhiteSpace(_settings.FromAddress))
        {
            throw new AppException("SMTP email provider is not fully configured.");
        }
    }

    private SmtpClient CreateClient()
    {
        var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.UseSsl
        };

        if (!string.IsNullOrWhiteSpace(_settings.SmtpUser))
        {
            client.Credentials = new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword);
        }

        return client;
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
