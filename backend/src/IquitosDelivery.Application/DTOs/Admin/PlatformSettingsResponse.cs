namespace IquitosDelivery.Application.DTOs.Admin;

public class PlatformSettingsResponse
{
    public Guid Id { get; set; }

    public string AppName { get; set; } = string.Empty;

    public string? Tagline { get; set; }

    public string? LogoUrl { get; set; }

    public string? AppIconUrl { get; set; }

    public string? SplashImageUrl { get; set; }

    public string? PrimaryColor { get; set; }

    public string? SecondaryColor { get; set; }

    public string? SupportEmail { get; set; }

    public string? SupportPhone { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}
