using IquitosDelivery.Application.DTOs.Zones;

namespace IquitosDelivery.Application.Interfaces;

public interface IZoneService
{
    Task<IReadOnlyList<ZoneResponse>> GetActiveZonesAsync(CancellationToken cancellationToken = default);
}
