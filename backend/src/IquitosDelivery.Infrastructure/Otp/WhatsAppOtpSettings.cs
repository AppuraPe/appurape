namespace IquitosDelivery.Infrastructure.Otp;

public class WhatsAppOtpSettings
{
    public bool Enabled { get; set; }

    public string GraphApiVersion { get; set; } = "v23.0";

    public string PhoneNumberId { get; set; } = string.Empty;

    public string AccessToken { get; set; } = string.Empty;

    public string TemplateName { get; set; } = "appurape_phone_verification";

    public string LanguageCode { get; set; } = "es_PE";

    public string ButtonSubType { get; set; } = "url";

    public string ButtonParameterType { get; set; } = "text";

    public bool IncludeButtonCodeParameter { get; set; } = true;
}
