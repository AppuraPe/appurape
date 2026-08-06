using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Google.Apis.Auth.OAuth2;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Push;

public class FirebasePushNotificationSender : IPushNotificationSender
{
    private const string FirebaseMessagingScope = "https://www.googleapis.com/auth/firebase.messaging";
    private const string AndroidNotificationChannelId = "appurape_default";

    private readonly HttpClient _httpClient;
    private readonly FirebasePushSettings _settings;
    private readonly ILogger<FirebasePushNotificationSender> _logger;
    private readonly GoogleCredential? _credential;

    public FirebasePushNotificationSender(
        HttpClient httpClient,
        IOptions<FirebasePushSettings> settings,
        ILogger<FirebasePushNotificationSender> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        try
        {
            _credential = BuildCredential(_settings);
            IsConfigured = _settings.Enabled &&
                           !string.IsNullOrWhiteSpace(_settings.ProjectId) &&
                           _credential is not null;
            ConfigurationError = IsConfigured
                ? null
                : BuildConfigurationError(_settings);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Firebase push credentials could not be loaded.");
            IsConfigured = false;
            ConfigurationError = "Firebase push no está configurado correctamente.";
        }
    }

    public bool IsConfigured { get; }

    public string? ConfigurationError { get; }

    public async Task<PushSendResult> SendToTokenAsync(
        string token,
        string title,
        string body,
        IReadOnlyDictionary<string, string>? data,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || _credential is null)
        {
            return new PushSendResult
            {
                IsSuccess = false,
                IsConfigurationError = true,
                ErrorMessage = ConfigurationError ?? "Firebase push no está configurado."
            };
        }

        try
        {
            var accessToken = await _credential.UnderlyingCredential
                .GetAccessTokenForRequestAsync(null, cancellationToken);

            using var requestMessage = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://fcm.googleapis.com/v1/projects/{_settings.ProjectId}/messages:send");

            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            requestMessage.Content = new StringContent(
                JsonSerializer.Serialize(BuildPayload(token, title, body, data)),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(requestMessage, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return new PushSendResult
                {
                    IsSuccess = true,
                    ProviderMessageId = TryReadProviderMessageId(responseBody)
                };
            }

            var errorCode = TryReadErrorCode(responseBody);
            return new PushSendResult
            {
                IsSuccess = false,
                ErrorCode = errorCode,
                ErrorMessage = TryReadErrorMessage(responseBody) ?? response.ReasonPhrase ?? "Firebase push request failed.",
                ShouldDeactivateToken = errorCode is "UNREGISTERED" or "INVALID_ARGUMENT"
            };
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Push send failed for Firebase token.");
            return new PushSendResult
            {
                IsSuccess = false,
                ErrorMessage = "No se pudo enviar la notificación push por un error de red o configuración."
            };
        }
    }

    private static GoogleCredential? BuildCredential(FirebasePushSettings settings)
    {
        if (!settings.Enabled)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(settings.CredentialsJson))
        {
            return GoogleCredential
                .FromJson(settings.CredentialsJson)
                .CreateScoped(FirebaseMessagingScope);
        }

        if (!string.IsNullOrWhiteSpace(settings.CredentialsPath) && File.Exists(settings.CredentialsPath))
        {
            return GoogleCredential
                .FromFile(settings.CredentialsPath)
                .CreateScoped(FirebaseMessagingScope);
        }

        return null;
    }

    private static string BuildConfigurationError(FirebasePushSettings settings)
    {
        if (!settings.Enabled)
        {
            return "Firebase push está deshabilitado.";
        }

        if (string.IsNullOrWhiteSpace(settings.ProjectId))
        {
            return "Firebase push no está configurado: falta Firebase:ProjectId.";
        }

        if (string.IsNullOrWhiteSpace(settings.CredentialsJson) && string.IsNullOrWhiteSpace(settings.CredentialsPath))
        {
            return "Firebase push no está configurado: falta Firebase:CredentialsPath o Firebase:CredentialsJson.";
        }

        return "Firebase push no está configurado correctamente.";
    }

    private static object BuildPayload(
        string token,
        string title,
        string body,
        IReadOnlyDictionary<string, string>? data)
    {
        return new
        {
            message = new
            {
                token,
                notification = new
                {
                    title,
                    body
                },
                data = NormalizeData(data),
                android = new
                {
                    priority = "HIGH",
                    notification = new
                    {
                        channel_id = AndroidNotificationChannelId
                    }
                }
            }
        };
    }

    private static IReadOnlyDictionary<string, string> NormalizeData(IReadOnlyDictionary<string, string>? data)
    {
        if (data is null || data.Count == 0)
        {
            return new Dictionary<string, string>();
        }

        return data
            .Where(item => !string.IsNullOrWhiteSpace(item.Key))
            .ToDictionary(
                item => item.Key.Trim(),
                item => item.Value?.Trim() ?? string.Empty,
                StringComparer.OrdinalIgnoreCase);
    }

    private static string? TryReadProviderMessageId(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);
            return document.RootElement.TryGetProperty("name", out var nameElement)
                ? nameElement.GetString()
                : null;
        }
        catch
        {
            return null;
        }
    }

    private static string? TryReadErrorCode(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);

            if (!document.RootElement.TryGetProperty("error", out var errorElement))
            {
                return null;
            }

            if (errorElement.TryGetProperty("details", out var detailsElement) &&
                detailsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var detail in detailsElement.EnumerateArray())
                {
                    if (detail.TryGetProperty("errorCode", out var errorCodeElement))
                    {
                        return errorCodeElement.GetString();
                    }
                }
            }

            if (errorElement.TryGetProperty("status", out var statusElement))
            {
                return statusElement.GetString();
            }
        }
        catch
        {
            // ignore parsing errors
        }

        return null;
    }

    private static string? TryReadErrorMessage(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);

            if (document.RootElement.TryGetProperty("error", out var errorElement) &&
                errorElement.TryGetProperty("message", out var messageElement))
            {
                return messageElement.GetString();
            }
        }
        catch
        {
            // ignore parsing errors
        }

        return null;
    }
}
