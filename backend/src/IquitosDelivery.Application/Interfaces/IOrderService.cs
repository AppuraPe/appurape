using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Interfaces;

public interface IOrderService
{
    Task<ValidateOrderResponse> ValidateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default);

    Task<CustomerOrderDetailResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CustomerOrderListItemResponse>> GetMyOrdersAsync(CancellationToken cancellationToken = default);

    Task<CustomerOrderDetailResponse> GetMyOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<CustomerOrderDetailResponse> CancelMyOrderAsync(Guid orderId, CancelOrderRequest request, CancellationToken cancellationToken = default);

    Task<CustomerOrderDetailResponse> CancelAdminOrderAsync(Guid orderId, CancelOrderRequest request, CancellationToken cancellationToken = default);

    Task<CustomerOrderDetailResponse> RateDriverAsync(Guid orderId, RateDriverRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RestaurantOrderListItemResponse>> GetRestaurantOrdersAsync(
        RestaurantOrderFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<RestaurantOrderPaymentResponse> GetRestaurantOrderPaymentAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<RestaurantOrderPaymentResponse> ConfirmRestaurantOrderPaymentAsync(
        Guid orderId,
        ConfirmRestaurantOrderPaymentRequest request,
        CancellationToken cancellationToken = default);

    Task<RestaurantOrderPaymentResponse> RejectRestaurantOrderPaymentAsync(
        Guid orderId,
        RejectRestaurantOrderPaymentRequest request,
        CancellationToken cancellationToken = default);

    Task<RestaurantOrderDetailResponse> GetRestaurantOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<RestaurantOrderDetailResponse> UpdateRestaurantOrderStatusAsync(Guid orderId, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default);

    Task<RestaurantOrderDetailResponse> CancelRestaurantOrderAsync(Guid orderId, CancelOrderRequest request, CancellationToken cancellationToken = default);
}
