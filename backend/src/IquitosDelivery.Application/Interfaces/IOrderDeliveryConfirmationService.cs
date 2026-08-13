using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Domain.Entities;

namespace IquitosDelivery.Application.Interfaces;

public interface IOrderDeliveryConfirmationService
{
    Task<OrderDeliveryConfirmationResponse> GetForCustomerAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderDeliveryConfirmationResponse> RegenerateForCustomerAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderDeliveryConfirmationResponse> RegenerateForAdminAsync(Guid orderId, string reason, CancellationToken cancellationToken = default);
    void EnsureIssued(Order order, Guid actorUserId);
    Task ValidateAsync(Order order, string code, Guid actorUserId, CancellationToken cancellationToken = default);
}
