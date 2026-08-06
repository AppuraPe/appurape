namespace IquitosDelivery.Infrastructure.Email;

public class EmailSettings
{
    public string Provider { get; set; } = "Smtp";

    public string FromName { get; set; } = string.Empty;

    public string FromAddress { get; set; } = string.Empty;

    public string SmtpHost { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public string SmtpUser { get; set; } = string.Empty;

    public string SmtpPassword { get; set; } = string.Empty;

    public bool UseSsl { get; set; } = true;

    public string BrandLogoUrl { get; set; } = string.Empty;

    public string BrandPrimaryColor { get; set; } = "#F97316";

    public string SupportEmail { get; set; } = string.Empty;
}
