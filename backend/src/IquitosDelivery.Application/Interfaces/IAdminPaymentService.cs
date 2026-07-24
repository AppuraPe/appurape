using IquitosDelivery.Application.DTOs.Admin;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminPaymentService
{
    Task<IReadOnlyList<AdminPaymentListItemResponse>> GetPendingPaymentsAsync(CancellationToken cancellationToken = default);

    Task<AdminPaymentDetailResponse> GetPaymentByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<AdminPaymentDetailResponse> ConfirmPaymentAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<AdminPaymentDetailResponse> RejectPaymentAsync(Guid orderId, CancellationToken cancellationToken = default);
}
