using IquitosDelivery.Application.DTOs.Businesses;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminBusinessTypeService
{
    Task<IReadOnlyList<AdminBusinessTypeResponse>> GetBusinessTypesAsync(CancellationToken cancellationToken = default);

    Task<AdminBusinessTypeResponse> CreateBusinessTypeAsync(UpsertAdminBusinessTypeRequest request, CancellationToken cancellationToken = default);

    Task<AdminBusinessTypeResponse> UpdateBusinessTypeAsync(Guid businessTypeId, UpsertAdminBusinessTypeRequest request, CancellationToken cancellationToken = default);

    Task<AdminBusinessTypeResponse> UpdateBusinessTypeStatusAsync(Guid businessTypeId, UpdateBusinessTypeStatusRequest request, CancellationToken cancellationToken = default);
}
