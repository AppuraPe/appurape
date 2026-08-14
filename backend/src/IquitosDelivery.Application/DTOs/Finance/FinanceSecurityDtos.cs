using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Finance;

public sealed record PaymentEvidenceUploadRequest(
    string OperationNumber,
    decimal DeclaredAmount,
    DateTime PaidAtUtc,
    byte[] Content,
    string FileName,
    string ContentType);

public sealed record PaymentEvidenceResponse(
    Guid Id,
    Guid PaymentId,
    string Method,
    string OperationNumber,
    decimal DeclaredAmount,
    DateTime PaidAtUtc,
    DateTime CreatedAtUtc);

public sealed record RefundResponse(
    Guid Id,
    Guid OrderId,
    string Status,
    decimal Amount,
    string CurrencyCode,
    string Reason,
    DateTime RequestedAtUtc,
    DateTime? BusinessReportedAtUtc,
    DateTime? CustomerConfirmedAtUtc,
    DateTime? CompletedAtUtc,
    string? ResolutionReason,
    Guid? EvidenceId);

public sealed record RefundEvidenceUploadRequest(
    string OperationNumber,
    decimal Amount,
    DateTime RefundedAtUtc,
    byte[] Content,
    string FileName,
    string ContentType);

public sealed record FinancialObligationResponse(
    Guid Id,
    Guid? OrderId,
    Guid? CommunityRequestId,
    string DebtorType,
    Guid? DebtorEntityId,
    string CreditorType,
    Guid? CreditorEntityId,
    string Concept,
    string Status,
    decimal Amount,
    string CurrencyCode,
    string Reference,
    DateTime? AvailableAtUtc,
    DateTime? DueAtUtc);

public sealed record ReconciliationDecisionRequest(
    string Decision,
    string Reason,
    FinancialPartyType? DebtorType = null,
    Guid? DebtorEntityId = null,
    FinancialPartyType? CreditorType = null,
    Guid? CreditorEntityId = null,
    FinancialObligationConcept? Concept = null);

public sealed record LegacyMovementResponse(Guid Id, Guid? OrderId, Guid? CommunityRequestId, string Type, string Status,
    decimal Amount, string CurrencyCode, string? Reference, string ReconciliationStatus);

public sealed record ResolveRefundRequest(bool Complete, string Reason);

public sealed record OpenPaymentReviewRequest(string Reason);

public sealed record ReleaseDuplicateEvidenceRequest(string Reason);
