using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Interfaces;

public interface IOrderFulfillmentService
{
    Task<OrderFulfillmentOptionsResponse> GetOptionsAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderCollaboratorPickupQuoteResponse> QuoteCollaboratorPickupAsync(Guid orderId, OrderCollaboratorPickupQuoteRequest request, CancellationToken cancellationToken = default);
    Task<OrderCollaboratorPickupResponse> CreateCollaboratorPickupAsync(Guid orderId, CreateOrderCollaboratorPickupRequest request, CancellationToken cancellationToken = default);
    Task<OrderCollaboratorPickupResponse> ConfirmBusinessPickupAsync(Guid orderId, ConfirmCollaboratorPickupRequest request, CancellationToken cancellationToken = default);
    Task<OrderDriverDeliveryResponse> RequestDriverDeliveryAsync(Guid orderId, RequestOrderDriverDeliveryRequest request, CancellationToken cancellationToken = default);
}
