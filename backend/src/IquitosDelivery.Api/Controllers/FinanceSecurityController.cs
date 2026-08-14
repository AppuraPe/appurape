using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Authorize]
public class FinanceSecurityController : ControllerBase
{
    private readonly IFinanceSecurityService _finance;
    private readonly IFileStorageService _storage;

    public FinanceSecurityController(IFinanceSecurityService finance, IFileStorageService storage)
    {
        _finance = finance;
        _storage = storage;
    }

    [HttpPost("api/orders/{orderId:guid}/payment-evidence")]
    [Authorize(Roles = "Customer")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<PaymentEvidenceResponse>> SubmitPaymentEvidence(Guid orderId, [FromForm] PaymentEvidenceForm form, CancellationToken cancellationToken)
    {
        var bytes = await ReadFileAsync(form.File, cancellationToken);
        return Ok(await _finance.SubmitPaymentEvidenceAsync(orderId,
            new PaymentEvidenceUploadRequest(form.OperationNumber, form.DeclaredAmount, form.PaidAtUtc, bytes, form.File.FileName, form.File.ContentType),
            Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken));
    }

    [HttpGet("api/business/orders/{orderId:guid}/payment-evidence")]
    [Authorize(Roles = "Restaurant")]
    public async Task<ActionResult<PaymentEvidenceResponse>> GetBusinessPaymentEvidence(Guid orderId, CancellationToken cancellationToken) =>
        Ok(await _finance.GetBusinessPaymentEvidenceAsync(orderId, cancellationToken));

    [HttpGet("api/payment-evidence/{evidenceId:guid}/file")]
    public async Task<IActionResult> DownloadPaymentEvidence(Guid evidenceId, CancellationToken cancellationToken)
    {
        var path = await _finance.GetPaymentEvidenceObjectPathAsync(evidenceId, cancellationToken);
        return Redirect(await _storage.CreatePrivateDownloadUrlAsync(path, TimeSpan.FromMinutes(5), cancellationToken));
    }

    [HttpPost("api/payments/{paymentId:guid}/open-review")]
    public async Task<IActionResult> OpenReview(Guid paymentId, [FromBody] OpenPaymentReviewRequest request, CancellationToken cancellationToken)
    {
        await _finance.OpenPaymentReviewAsync(paymentId, request, Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken);
        return NoContent();
    }

    [HttpPost("api/admin/payment-evidence/{evidenceId:guid}/release-duplicate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReleaseDuplicate(Guid evidenceId, [FromBody] ReleaseDuplicateEvidenceRequest request, CancellationToken cancellationToken)
    {
        await _finance.ReleaseDuplicateEvidenceAsync(evidenceId, request, Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken);
        return NoContent();
    }

    [HttpPost("api/orders/{orderId:guid}/refunds")]
    public async Task<ActionResult<RefundResponse>> CreateRefund(Guid orderId, [FromBody] CreateRefundForm request, CancellationToken cancellationToken) =>
        Ok(await _finance.CreateRefundAsync(orderId, request.Reason, Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken));

    [HttpGet("api/orders/{orderId:guid}/refund")]
    public async Task<ActionResult<RefundResponse>> GetRefund(Guid orderId, CancellationToken cancellationToken) =>
        Ok(await _finance.GetRefundForOrderAsync(orderId, cancellationToken));

    [HttpPost("api/refunds/{refundId:guid}/business-evidence")]
    [Authorize(Roles = "Restaurant")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<RefundResponse>> SubmitRefundEvidence(Guid refundId, [FromForm] RefundEvidenceForm form, CancellationToken cancellationToken)
    {
        var bytes = await ReadFileAsync(form.File, cancellationToken);
        return Ok(await _finance.SubmitBusinessRefundEvidenceAsync(refundId,
            new RefundEvidenceUploadRequest(form.OperationNumber, form.Amount, form.RefundedAtUtc, bytes, form.File.FileName, form.File.ContentType),
            Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken));
    }

    [HttpPost("api/refunds/{refundId:guid}/customer-confirm")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<RefundResponse>> ConfirmRefund(Guid refundId, CancellationToken cancellationToken) =>
        Ok(await _finance.ConfirmCustomerRefundAsync(refundId, Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken));

    [HttpPost("api/refunds/{refundId:guid}/customer-dispute")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<RefundResponse>> DisputeRefund(Guid refundId, [FromBody] CreateRefundForm request, CancellationToken cancellationToken) =>
        Ok(await _finance.DisputeCustomerRefundAsync(refundId, request.Reason, Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken));

    [HttpPost("api/admin/refunds/{refundId:guid}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RefundResponse>> ResolveRefund(Guid refundId, [FromBody] ResolveRefundRequest request, CancellationToken cancellationToken) =>
        Ok(await _finance.ResolveRefundAsync(refundId, request, Request.Headers["Idempotency-Key"].FirstOrDefault(), cancellationToken));

    [HttpGet("api/admin/refunds")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<RefundResponse>>> GetAdminRefunds(CancellationToken cancellationToken) =>
        Ok(await _finance.GetAdminRefundsAsync(cancellationToken));

    [HttpGet("api/refund-evidence/{evidenceId:guid}/file")]
    public async Task<IActionResult> DownloadRefundEvidence(Guid evidenceId, CancellationToken cancellationToken)
    {
        var path = await _finance.GetRefundEvidenceObjectPathAsync(evidenceId, cancellationToken);
        return Redirect(await _storage.CreatePrivateDownloadUrlAsync(path, TimeSpan.FromMinutes(5), cancellationToken));
    }

    [HttpGet("api/admin/financial-obligations")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<FinancialObligationResponse>>> GetObligations(CancellationToken cancellationToken) =>
        Ok(await _finance.GetObligationsAsync(cancellationToken));

    [HttpGet("api/admin/finance/reconciliation")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<LegacyMovementResponse>>> GetLegacyMovements(CancellationToken cancellationToken) =>
        Ok(await _finance.GetLegacyMovementsAsync(cancellationToken));

    [HttpPost("api/admin/finance/reconciliation/{movementId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LegacyMovementResponse>> Reconcile(Guid movementId, [FromBody] ReconciliationDecisionRequest request, CancellationToken cancellationToken) =>
        Ok(await _finance.ReconcileLegacyMovementAsync(movementId, request, cancellationToken));

    private static async Task<byte[]> ReadFileAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) throw new BadHttpRequestException("Adjunta el comprobante.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        return stream.ToArray();
    }
}

public sealed class PaymentEvidenceForm
{
    public string OperationNumber { get; set; } = string.Empty;
    public decimal DeclaredAmount { get; set; }
    public DateTime PaidAtUtc { get; set; }
    public IFormFile File { get; set; } = null!;
}

public sealed class RefundEvidenceForm
{
    public string OperationNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime RefundedAtUtc { get; set; }
    public IFormFile File { get; set; } = null!;
}

public sealed record CreateRefundForm(string Reason);
