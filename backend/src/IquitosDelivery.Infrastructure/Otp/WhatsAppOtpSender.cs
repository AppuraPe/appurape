using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Otp;

public class WhatsAppOtpSender : IPhoneOtpSender
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WhatsAppOtpSender> _logger;
    private readonly WhatsAppOtpSettings _settings;

    public WhatsAppOtpSender(
        HttpClient httpClient,
        IOptions<PhoneOtpSettings> settings,
        ILogger<WhatsAppOtpSender> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _settings = settings.Value.WhatsApp;
    }

    public async Task<PhoneOtpSendResult> SendAsync(string phoneNormalized, string code, int expirationMinutes, CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation(
                "WhatsApp OTP provider disabled. QA code for {PhoneMasked}: {Code}",
                MaskPhone(phoneNormalized),
                code);

            return new PhoneOtpSendResult { Sent = true, Channel = "WhatsApp-Logging" };
        }

        var configurationError = GetConfigurationError();
        if (!string.IsNullOrWhiteSpace(configurationError))
        {
            _logger.LogWarning("WhatsApp OTP provider is enabled but not configured: {ConfigurationError}", configurationError);
            return new PhoneOtpSendResult
            {
                Sent = false,
                Channel = "WhatsApp",
                ErrorMessage = "WhatsApp OTP no está configurado correctamente."
            };
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, BuildMessagesPath());
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.AccessToken.Trim());
        request.Content = JsonContent.Create(BuildTemplatePayload(phoneNormalized, code));

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "WhatsApp OTP send failed. Status={StatusCode}; Body={Body}",
                (int)response.StatusCode,
                body);

            return new PhoneOtpSendResult
            {
                Sent = false,
                Channel = "WhatsApp",
                ErrorMessage = "No se pudo enviar el código por WhatsApp."
            };
        }

        var providerMessageId = TryExtractMessageId(body);
        return new PhoneOtpSendResult
        {
            Sent = true,
            Channel = "WhatsApp",
            ProviderMessageId = providerMessageId
        };
    }

    private WhatsAppTemplateMessageRequest BuildTemplatePayload(string phoneNormalized, string code)
    {
        var components = new List<WhatsAppTemplateComponent>
        {
            new()
            {
                Type = "body",
                Parameters =
                [
                    new WhatsAppTemplateParameter
                    {
                        Type = "text",
                        Text = code
                    }
                ]
            }
        };

        if (_settings.IncludeButtonCodeParameter)
        {
            components.Add(new WhatsAppTemplateComponent
            {
                Type = "button",
                SubType = string.IsNullOrWhiteSpace(_settings.ButtonSubType) ? "url" : _settings.ButtonSubType.Trim(),
                Index = "0",
                Parameters =
                [
                    new WhatsAppTemplateParameter
                    {
                        Type = string.IsNullOrWhiteSpace(_settings.ButtonParameterType) ? "text" : _settings.ButtonParameterType.Trim(),
                        Text = code
                    }
                ]
            });
        }

        return new WhatsAppTemplateMessageRequest
        {
            To = phoneNormalized,
            Template = new WhatsAppTemplate
            {
                Name = _settings.TemplateName.Trim(),
                Language = new WhatsAppTemplateLanguage { Code = _settings.LanguageCode.Trim() },
                Components = components
            }
        };
    }

    private string BuildMessagesPath()
    {
        var version = string.IsNullOrWhiteSpace(_settings.GraphApiVersion)
            ? "v23.0"
            : _settings.GraphApiVersion.Trim().TrimStart('/');

        return $"/{version}/{_settings.PhoneNumberId.Trim()}/messages";
    }

    private string? GetConfigurationError()
    {
        if (string.IsNullOrWhiteSpace(_settings.PhoneNumberId)) return "PhoneNumberId is missing.";
        if (string.IsNullOrWhiteSpace(_settings.AccessToken)) return "AccessToken is missing.";
        if (string.IsNullOrWhiteSpace(_settings.TemplateName)) return "TemplateName is missing.";
        if (string.IsNullOrWhiteSpace(_settings.LanguageCode)) return "LanguageCode is missing.";
        return null;
    }

    private static string? TryExtractMessageId(string responseBody)
    {
        try
        {
            var response = System.Text.Json.JsonSerializer.Deserialize<WhatsAppMessagesResponse>(responseBody);
            return response?.Messages?.FirstOrDefault()?.Id;
        }
        catch
        {
            return null;
        }
    }

    private static string MaskPhone(string phoneNormalized)
    {
        return phoneNormalized.Length <= 4 ? "****" : $"{phoneNormalized[..2]}*****{phoneNormalized[^4..]}";
    }

    private sealed class WhatsAppTemplateMessageRequest
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; init; } = "whatsapp";

        [JsonPropertyName("recipient_type")]
        public string RecipientType { get; init; } = "individual";

        [JsonPropertyName("to")]
        public string To { get; init; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; init; } = "template";

        [JsonPropertyName("template")]
        public WhatsAppTemplate Template { get; init; } = new();
    }

    private sealed class WhatsAppTemplate
    {
        [JsonPropertyName("name")]
        public string Name { get; init; } = string.Empty;

        [JsonPropertyName("language")]
        public WhatsAppTemplateLanguage Language { get; init; } = new();

        [JsonPropertyName("components")]
        public IReadOnlyList<WhatsAppTemplateComponent> Components { get; init; } = [];
    }

    private sealed class WhatsAppTemplateLanguage
    {
        [JsonPropertyName("code")]
        public string Code { get; init; } = string.Empty;
    }

    private sealed class WhatsAppTemplateComponent
    {
        [JsonPropertyName("type")]
        public string Type { get; init; } = string.Empty;

        [JsonPropertyName("sub_type")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? SubType { get; init; }

        [JsonPropertyName("index")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Index { get; init; }

        [JsonPropertyName("parameters")]
        public IReadOnlyList<WhatsAppTemplateParameter> Parameters { get; init; } = [];
    }

    private sealed class WhatsAppTemplateParameter
    {
        [JsonPropertyName("type")]
        public string Type { get; init; } = string.Empty;

        [JsonPropertyName("text")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Text { get; init; }
    }

    private sealed class WhatsAppMessagesResponse
    {
        [JsonPropertyName("messages")]
        public IReadOnlyList<WhatsAppMessageResponse>? Messages { get; init; }
    }

    private sealed class WhatsAppMessageResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; init; }
    }
}
