using IquitosDelivery.Application.DTOs.Admin;

namespace IquitosDelivery.Application.Interfaces;

public interface IPlatformSettingsService
{
    Task<PlatformSettingsResponse> GetPublicSettingsAsync(CancellationToken cancellationToken = default);
}
