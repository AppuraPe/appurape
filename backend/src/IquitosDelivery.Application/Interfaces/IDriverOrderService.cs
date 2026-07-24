using IquitosDelivery.Application.DTOs.Drivers;

namespace IquitosDelivery.Application.Interfaces;

public interface IDriverOrderService
{
    Task<IReadOnlyList<AvailableDriverOrderListItemResponse>> GetAvailableOrdersAsync(
        DriverAvailableOrderFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<DriverOrderDetailResponse> GetAvailableOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<DriverOrderDetailResponse?> GetActiveOrderAsync(CancellationToken cancellationToken = default);

    Task<DriverOrderDetailResponse> GetDriverOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<DriverOrderDetailResponse> TakeOrderAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DriverAssignedOrderListItemResponse>> GetMyAssignedOrdersAsync(
        DriverAssignedOrderFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<DriverOrderDetailResponse> GetMyOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<DriverOrderDetailResponse> UpdateMyOrderStatusAsync(Guid orderId, UpdateDriverOrderStatusRequest request, CancellationToken cancellationToken = default);
}
