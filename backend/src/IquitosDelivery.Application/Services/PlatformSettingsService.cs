using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class PlatformSettingsService : IPlatformSettingsService, IAdminPlatformSettingsService
{
    private const string DefaultKey = "default";

    private readonly IAppDbContext _dbContext;

    public PlatformSettingsService(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PlatformSettingsResponse> GetPublicSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        return Map(settings);
    }

    public async Task<PlatformSettingsResponse> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        return Map(settings);
    }

    public async Task<PlatformSettingsResponse> UpdateSettingsAsync(UpdatePlatformSettingsRequest request, CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);

        settings.AppName = string.IsNullOrWhiteSpace(request.AppName) ? "AppuraPe" : request.AppName.Trim();
        settings.Tagline = NormalizeOptional(request.Tagline);
        settings.LogoUrl = NormalizeOptional(request.LogoUrl);
        settings.AppIconUrl = NormalizeOptional(request.AppIconUrl);
        settings.SplashImageUrl = NormalizeOptional(request.SplashImageUrl);
        settings.PrimaryColor = NormalizeOptional(request.PrimaryColor);
        settings.SecondaryColor = NormalizeOptional(request.SecondaryColor);
        settings.SupportEmail = NormalizeOptional(request.SupportEmail);
        settings.SupportPhone = NormalizeOptional(request.SupportPhone);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(settings);
    }

    private async Task<PlatformSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken)
    {
        var settings = await _dbContext.PlatformSettings
            .FirstOrDefaultAsync(x => x.Key == DefaultKey, cancellationToken);

        if (settings is not null)
        {
            return settings;
        }

        settings = new PlatformSettings
        {
            Id = Guid.NewGuid(),
            Key = DefaultKey,
            AppName = "AppuraPe",
            Tagline = "Entrega local para negocios y comunidad",
            PrimaryColor = "#E51B23",
            SecondaryColor = "#F59E0B"
        };

        _dbContext.Add(settings);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return settings;
    }

    private static PlatformSettingsResponse Map(PlatformSettings settings)
    {
        return new PlatformSettingsResponse
        {
            Id = settings.Id,
            AppName = settings.AppName,
            Tagline = settings.Tagline,
            LogoUrl = settings.LogoUrl,
            AppIconUrl = settings.AppIconUrl,
            SplashImageUrl = settings.SplashImageUrl,
            PrimaryColor = settings.PrimaryColor,
            SecondaryColor = settings.SecondaryColor,
            SupportEmail = settings.SupportEmail,
            SupportPhone = settings.SupportPhone,
            CreatedAtUtc = settings.CreatedAtUtc,
            UpdatedAtUtc = settings.UpdatedAtUtc
        };
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
