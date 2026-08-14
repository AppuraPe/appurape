namespace IquitosDelivery.Application.DTOs.Finance;

public sealed record ReportSettlementPaymentRequest(
    string OperationNumber,
    decimal Amount,
    DateTime PaidAtUtc,
    byte[] Content,
    string FileName,
    string ContentType);
