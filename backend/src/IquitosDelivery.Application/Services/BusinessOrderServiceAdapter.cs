using IquitosDelivery.Application.Interfaces;

namespace IquitosDelivery.Application.Services;

public class BusinessOrderServiceAdapter : IBusinessOrderService
{
    private readonly IOrderService _orderService;

    public BusinessOrderServiceAdapter(IOrderService orderService)
    {
        _orderService = orderService;
    }

    public Task<IReadOnlyList<BusinessOrderListItemResponse>> GetBusinessOrdersAsync(
        BusinessOrderFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        return _orderService.GetRestaurantOrdersAsync(filters, cancellationToken);
    }

    public Task<BusinessOrderDetailResponse> GetBusinessOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return _orderService.GetRestaurantOrderByIdAsync(orderId, cancellationToken);
    }

    public Task<BusinessOrderDetailResponse> UpdateBusinessOrderStatusAsync(Guid orderId, BusinessOrderStatusUpdateRequest request, CancellationToken cancellationToken = default)
    {
        return _orderService.UpdateRestaurantOrderStatusAsync(orderId, request, cancellationToken);
    }

    public Task<BusinessOrderDetailResponse> CancelBusinessOrderAsync(Guid orderId, CancelOrderRequest request, CancellationToken cancellationToken = default)
    {
        return _orderService.CancelRestaurantOrderAsync(orderId, request, cancellationToken);
    }
}
