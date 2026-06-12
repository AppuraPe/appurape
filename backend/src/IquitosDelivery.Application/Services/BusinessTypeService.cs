using IquitosDelivery.Application.DTOs.Businesses;
using IquitosDelivery.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class BusinessTypeService : IBusinessTypeService
{
    private readonly IAppDbContext _dbContext;

    public BusinessTypeService(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<BusinessTypeListItemResponse>> GetActiveBusinessTypesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.BusinessTypes
            .Where(x => x.IsActive)
            .Select(x => new BusinessTypeListItemResponse
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Slug = x.Slug,
                IconKey = x.IconKey,
                SortOrder = x.SortOrder,
                BusinessCount = x.Restaurants.Count(r => r.ApprovalStatus == Domain.Enums.ApprovalStatus.Approved && r.IsActive)
            })
            .OrderByDescending(x => x.BusinessCount)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }
}
