using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class PlatformSettings : BaseEntity
{
    public string Key { get; set; } = "default";

    public string AppName { get; set; } = "AppuraPe";

    public string? Tagline { get; set; }

    public string? LogoUrl { get; set; }

    public string? AppIconUrl { get; set; }

    public string? SplashImageUrl { get; set; }

    public string? PrimaryColor { get; set; }

    public string? SecondaryColor { get; set; }

    public string? SupportEmail { get; set; }

    public string? SupportPhone { get; set; }
}
