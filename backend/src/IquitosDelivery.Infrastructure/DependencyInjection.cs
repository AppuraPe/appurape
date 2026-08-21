using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Infrastructure.Email;
using IquitosDelivery.Infrastructure.Otp;
using IquitosDelivery.Infrastructure.Persistence;
using IquitosDelivery.Infrastructure.Push;
using IquitosDelivery.Infrastructure.Security;
using IquitosDelivery.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure;

public static class DependencyInjection
{
    private const string LoggingProvider = "Logging";
    private const string MailtrapProvider = "Mailtrap";
    private const string SmtpProvider = "Smtp";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = ConnectionStringResolver.ResolveForRuntime(configuration);

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddSingleton<IOptions<EmailSettings>>(_ =>
        {
            var emailSection = configuration.GetSection("Email");
            var smtpPort = int.TryParse(emailSection["SmtpPort"], out var port) ? port : 587;
            var useSsl = bool.TryParse(emailSection["UseSsl"], out var ssl) ? ssl : true;

            return Options.Create(new EmailSettings
            {
                Provider = emailSection["Provider"] ?? "Smtp",
                FromName = emailSection["FromName"] ?? string.Empty,
                FromAddress = emailSection["FromAddress"] ?? string.Empty,
                SmtpHost = emailSection["SmtpHost"] ?? string.Empty,
                SmtpPort = smtpPort,
                SmtpUser = emailSection["SmtpUser"] ?? string.Empty,
                SmtpPassword = emailSection["SmtpPassword"] ?? string.Empty,
                UseSsl = useSsl,
                BrandLogoUrl = emailSection["BrandLogoUrl"] ?? string.Empty,
                BrandPrimaryColor = emailSection["BrandPrimaryColor"] ?? "#F97316",
                SupportEmail = emailSection["SupportEmail"] ?? string.Empty
            });
        });
        services.AddSingleton<IOptions<StorageSettings>>(_ =>
        {
            var storageSection = configuration.GetSection("Storage");

            return Options.Create(new StorageSettings
            {
                Provider = storageSection["Provider"] ?? string.Empty,
                PublicBaseUrl = storageSection["PublicBaseUrl"] ?? string.Empty,
                Supabase = new SupabaseStorageSettings
                {
                    Url = storageSection.GetSection("Supabase")["Url"] ?? string.Empty,
                    ServiceKey = storageSection.GetSection("Supabase")["ServiceKey"] ?? string.Empty,
                    Bucket = storageSection.GetSection("Supabase")["Bucket"] ?? "appurape",
                    PrivateBucket = storageSection.GetSection("Supabase")["PrivateBucket"] ?? "appurape-private"
                }
            });
        });
        services.AddSingleton<IOptions<GoogleAuthSettings>>(_ =>
            Options.Create(new GoogleAuthSettings
            {
                AllowedClientIds = configuration
                    .GetSection("GoogleAuth:AllowedClientIds")
                    .Get<string[]>() ?? []
            }));
        services.AddSingleton<IOptions<FirebasePushSettings>>(_ =>
            Options.Create(new FirebasePushSettings
            {
                Enabled = bool.TryParse(configuration["Firebase:Enabled"], out var enabled) && enabled,
                ProjectId = configuration["Firebase:ProjectId"] ?? string.Empty,
                CredentialsPath = configuration["Firebase:CredentialsPath"] ?? string.Empty,
                CredentialsJson = configuration["Firebase:CredentialsJson"] ?? string.Empty
            }));
        services.AddSingleton<IOptions<PhoneOtpSettings>>(_ =>
        {
            var otpSection = configuration.GetSection("PhoneOtp");
            var whatsAppSection = otpSection.GetSection("WhatsApp");

            return Options.Create(new PhoneOtpSettings
            {
                RequireForRegistration = bool.TryParse(otpSection["RequireForRegistration"], out var requireForRegistration) && requireForRegistration,
                WhatsApp = new WhatsAppOtpSettings
                {
                    Enabled = bool.TryParse(whatsAppSection["Enabled"], out var whatsAppEnabled) && whatsAppEnabled,
                    GraphApiVersion = whatsAppSection["GraphApiVersion"] ?? "v23.0",
                    PhoneNumberId = whatsAppSection["PhoneNumberId"] ?? string.Empty,
                    AccessToken = whatsAppSection["AccessToken"] ?? string.Empty,
                    TemplateName = whatsAppSection["TemplateName"] ?? "appurape_phone_verification",
                    LanguageCode = whatsAppSection["LanguageCode"] ?? "es_PE",
                    ButtonSubType = whatsAppSection["ButtonSubType"] ?? "url",
                    ButtonParameterType = whatsAppSection["ButtonParameterType"] ?? "text",
                    IncludeButtonCodeParameter = !bool.TryParse(whatsAppSection["IncludeButtonCodeParameter"], out var includeButtonCodeParameter)
                        || includeButtonCodeParameter
                }
            });
        });
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IGoogleTokenVerifier, GoogleTokenVerifier>();
        services.AddHttpClient<IPushNotificationSender, FirebasePushNotificationSender>();
        services.AddHttpClient<IPhoneOtpSender, WhatsAppOtpSender>(client =>
        {
            client.BaseAddress = new Uri("https://graph.facebook.com");
        });
        services.AddScoped<IEmailSender>(provider =>
        {
            var emailSettings = provider.GetRequiredService<IOptions<EmailSettings>>().Value;
            var normalizedProvider = NormalizeProvider(emailSettings.Provider);

            return normalizedProvider switch
            {
                LoggingProvider => provider.GetRequiredService<LoggingEmailSender>(),
                MailtrapProvider => provider.GetRequiredService<SmtpEmailSender>(),
                SmtpProvider => provider.GetRequiredService<SmtpEmailSender>(),
                _ => throw new InvalidOperationException(
                    $"Email provider '{emailSettings.Provider}' is invalid. Supported values: {LoggingProvider}, {MailtrapProvider}, {SmtpProvider}.")
            };
        });
        services.AddScoped<LoggingEmailSender>();
        services.AddScoped<EmailTemplateRenderer>();
        services.AddScoped<SmtpEmailSender>();
        services.AddHttpClient<IFileStorageService, SupabaseFileStorageService>((provider, client) =>
        {
            var storageSettings = provider.GetRequiredService<IOptions<StorageSettings>>().Value;
            if (!string.IsNullOrWhiteSpace(storageSettings.Supabase.Url))
            {
                client.BaseAddress = new Uri(storageSettings.Supabase.Url.TrimEnd('/'));
            }
        });

        return services;
    }

    private static string NormalizeProvider(string? provider)
    {
        return provider?.Trim() switch
        {
            var value when string.Equals(value, LoggingProvider, StringComparison.OrdinalIgnoreCase) => LoggingProvider,
            var value when string.Equals(value, MailtrapProvider, StringComparison.OrdinalIgnoreCase) => MailtrapProvider,
            var value when string.Equals(value, SmtpProvider, StringComparison.OrdinalIgnoreCase) => SmtpProvider,
            _ => provider?.Trim() ?? string.Empty
        };
    }
}
