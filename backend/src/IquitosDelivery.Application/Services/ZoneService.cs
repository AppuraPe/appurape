using IquitosDelivery.Application.DTOs.Zones;
using IquitosDelivery.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class ZoneService : IZoneService
{
    private readonly IAppDbContext _dbContext;

    public ZoneService(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ZoneResponse>> GetActiveZonesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Zones
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new ZoneResponse
            {
                Id = x.Id,
                Name = x.Name,
                DeliveryFee = x.DeliveryFee,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}
