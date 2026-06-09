using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Infrastructure.Email;
using IquitosDelivery.Infrastructure.Persistence;
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
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' was not found. Set ConnectionStrings__DefaultConnection in the hosting environment.");

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
                UseSsl = useSsl
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
                    Bucket = storageSection.GetSection("Supabase")["Bucket"] ?? "appurape"
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
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IGoogleTokenVerifier, GoogleTokenVerifier>();
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
