using IquitosDelivery.Application.DTOs.Businesses;

namespace IquitosDelivery.Application.Interfaces;

public interface IBusinessTypeService
{
    Task<IReadOnlyList<BusinessTypeListItemResponse>> GetActiveBusinessTypesAsync(CancellationToken cancellationToken = default);
}
