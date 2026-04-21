using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Interfaces;

public interface IOrderService
{
    Task<CustomerOrderDetailResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CustomerOrderListItemResponse>> GetMyOrdersAsync(CancellationToken cancellationToken = default);

    Task<CustomerOrderDetailResponse> GetMyOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RestaurantOrderListItemResponse>> GetRestaurantOrdersAsync(CancellationToken cancellationToken = default);

    Task<RestaurantOrderDetailResponse> GetRestaurantOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<RestaurantOrderDetailResponse> UpdateRestaurantOrderStatusAsync(Guid orderId, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default);
}
