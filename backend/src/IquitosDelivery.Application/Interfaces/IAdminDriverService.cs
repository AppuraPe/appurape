using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Drivers;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminDriverService
{
    Task<IReadOnlyList<AdminDriverListItemResponse>> GetDriversAsync(AdminDriverFilterRequest filters, CancellationToken cancellationToken = default);

    Task<AdminDriverDetailResponse> GetDriverByIdAsync(Guid driverId, CancellationToken cancellationToken = default);

    Task<AdminDriverDetailResponse> UpdateDriverStatusAsync(Guid driverId, UpdateAdminEntityStatusRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PendingDriverResponse>> GetPendingDriversAsync(CancellationToken cancellationToken = default);

    Task<PendingDriverResponse> ApproveDriverAsync(Guid driverId, CancellationToken cancellationToken = default);

    Task<PendingDriverResponse> RejectDriverAsync(Guid driverId, CancellationToken cancellationToken = default);
}
