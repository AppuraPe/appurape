using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Interfaces;

public interface IBusinessOrderService
{
    Task<IReadOnlyList<BusinessOrderListItemResponse>> GetBusinessOrdersAsync(
        BusinessOrderFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<BusinessOrderDetailResponse> GetBusinessOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<BusinessOrderDetailResponse> UpdateBusinessOrderStatusAsync(Guid orderId, BusinessOrderStatusUpdateRequest request, CancellationToken cancellationToken = default);

    Task<BusinessOrderDetailResponse> CancelBusinessOrderAsync(Guid orderId, CancelOrderRequest request, CancellationToken cancellationToken = default);

    Task<BusinessOrderDetailResponse> DispatchBusinessDeliveryAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<BusinessOrderDetailResponse> ConfirmBusinessDeliveryAsync(Guid orderId, ConfirmOrderDeliveryRequest request, CancellationToken cancellationToken = default);
}
