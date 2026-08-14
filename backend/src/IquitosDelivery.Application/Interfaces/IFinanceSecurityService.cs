using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Domain.Entities;

namespace IquitosDelivery.Application.Interfaces;

public interface IFinanceSecurityService
{
    Task<PaymentEvidenceResponse> SubmitPaymentEvidenceAsync(Guid orderId, PaymentEvidenceUploadRequest request, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<PaymentEvidenceResponse> GetBusinessPaymentEvidenceAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<string> GetPaymentEvidenceObjectPathAsync(Guid evidenceId, CancellationToken cancellationToken = default);
    Task OpenPaymentReviewAsync(Guid paymentId, OpenPaymentReviewRequest request, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task ReleaseDuplicateEvidenceAsync(Guid evidenceId, ReleaseDuplicateEvidenceRequest request, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<RefundResponse> CreateRefundAsync(Guid orderId, string reason, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<RefundResponse> GetRefundForOrderAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<RefundResponse> SubmitBusinessRefundEvidenceAsync(Guid refundId, RefundEvidenceUploadRequest request, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<RefundResponse> ConfirmCustomerRefundAsync(Guid refundId, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<RefundResponse> DisputeCustomerRefundAsync(Guid refundId, string reason, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<RefundResponse> ResolveRefundAsync(Guid refundId, ResolveRefundRequest request, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RefundResponse>> GetAdminRefundsAsync(CancellationToken cancellationToken = default);
    Task<string> GetRefundEvidenceObjectPathAsync(Guid evidenceId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FinancialObligationResponse>> GetObligationsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LegacyMovementResponse>> GetLegacyMovementsAsync(CancellationToken cancellationToken = default);
    Task<LegacyMovementResponse> ReconcileLegacyMovementAsync(Guid movementId, ReconciliationDecisionRequest request, CancellationToken cancellationToken = default);
    Task CreateOrderObligationsAsync(Order order, Guid businessOwnerUserId, CancellationToken cancellationToken = default);
    Task ReplacePendingOrderObligationsAsync(Order order, Guid businessOwnerUserId, CancellationToken cancellationToken = default);
    Task AssignOrderCourierAsync(Guid orderId, Guid courierUserId, CancellationToken cancellationToken = default);
    Task MarkOrderObligationsAvailableAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task CancelOrderObligationsAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task CreateFavorObligationAsync(CommunityRequest request, CancellationToken cancellationToken = default);
    Task AssignFavorCollaboratorAsync(Guid requestId, Guid collaboratorUserId, CancellationToken cancellationToken = default);
    Task MarkFavorObligationsAvailableAsync(Guid requestId, CancellationToken cancellationToken = default);
}
