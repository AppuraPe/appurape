using IquitosDelivery.Application.DTOs.Admin;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminPlatformSettingsService
{
    Task<PlatformSettingsResponse> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task<PlatformSettingsResponse> UpdateSettingsAsync(UpdatePlatformSettingsRequest request, CancellationToken cancellationToken = default);
}
