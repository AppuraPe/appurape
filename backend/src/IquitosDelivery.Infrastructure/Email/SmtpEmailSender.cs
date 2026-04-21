using System.Net;
using System.Net.Mail;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Email;

public class SmtpEmailSender : IEmailSender
{
    private const string VerificationSubject = "Codigo de verificacion";

    private readonly ILogger<SmtpEmailSender> _logger;
    private readonly EmailSettings _settings;

    public SmtpEmailSender(IOptions<EmailSettings> settings, ILogger<SmtpEmailSender> logger)
    {
        _logger = logger;
        _settings = settings.Value;
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
            if (string.IsNullOrWhiteSpace(_settings.SmtpHost) || string.IsNullOrWhiteSpace(_settings.FromAddress))
            {
                throw new AppException("SMTP email provider is not fully configured.");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromAddress, _settings.FromName),
                Subject = VerificationSubject,
                Body = $"""
                        Hola {recipientName},

                        Tu codigo de verificacion es: {code}

                        Este codigo vence en {expiresInMinutes} minutos.
                        """,
                IsBodyHtml = false
            };

            message.To.Add(toEmail);

            using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
            {
                EnableSsl = _settings.UseSsl
            };

            if (!string.IsNullOrWhiteSpace(_settings.SmtpUser))
            {
                client.Credentials = new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword);
            }

            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Verification email could not be sent to {Email}.", toEmail);
            throw exception is AppException appException
                ? appException
                : new AppException("Verification email could not be sent.");
        }
    }
}
