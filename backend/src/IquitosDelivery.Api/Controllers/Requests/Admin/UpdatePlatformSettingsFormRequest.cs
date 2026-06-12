using Microsoft.AspNetCore.Http;

namespace IquitosDelivery.Api.Controllers.Requests.Admin;

public class UpdatePlatformSettingsFormRequest
{
    public string AppName { get; set; } = string.Empty;

    public string? Tagline { get; set; }

    public string? LogoUrl { get; set; }

    public string? AppIconUrl { get; set; }

    public string? SplashImageUrl { get; set; }

    public string? PrimaryColor { get; set; }

    public string? SecondaryColor { get; set; }

    public string? SupportEmail { get; set; }

    public string? SupportPhone { get; set; }

    public IFormFile? LogoFile { get; set; }

    public IFormFile? AppIconFile { get; set; }

    public IFormFile? SplashImageFile { get; set; }
}
