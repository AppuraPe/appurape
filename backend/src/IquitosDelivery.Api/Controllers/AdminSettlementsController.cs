using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/settlements")]
[Authorize(Roles = "Admin")]
public class AdminSettlementsController : ControllerBase
{
    private readonly IAdminFinanceService _adminFinanceService;
    private readonly IFileStorageService? _storage;

    public AdminSettlementsController(IAdminFinanceService adminFinanceService, IFileStorageService? storage = null)
    {
        _adminFinanceService = adminFinanceService;
        _storage = storage;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SettlementBatchResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SettlementBatchResponse>>> GetSettlements(CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetSettlementsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> GetSettlement(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetSettlementByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> CreateSettlement(
        [FromBody] CreateSettlementBatchRequest request,
        CancellationToken cancellationToken)
    {
        if (ControllerContext.HttpContext is not null && string.IsNullOrWhiteSpace(Request.Headers["Idempotency-Key"].FirstOrDefault())) return BadRequest(new { message = "Envía Idempotency-Key." });
        var response = await _adminFinanceService.CreateSettlementAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/mark-paid")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> MarkPaid(Guid id, CancellationToken cancellationToken)
    {
        if (ControllerContext.HttpContext is not null && string.IsNullOrWhiteSpace(Request.Headers["Idempotency-Key"].FirstOrDefault())) return BadRequest(new { message = "Envía Idempotency-Key." });
        var response = await _adminFinanceService.MarkSettlementPaidAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<SettlementBatchResponse>> Approve(Guid id, CancellationToken cancellationToken)
    {
        if (ControllerContext.HttpContext is not null && string.IsNullOrWhiteSpace(Request.Headers["Idempotency-Key"].FirstOrDefault())) return BadRequest(new { message = "Envía Idempotency-Key." });
        return Ok(await _adminFinanceService.ApproveSettlementAsync(id, cancellationToken));
    }

    [HttpPost("{id:guid}/report-payment")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<SettlementBatchResponse>> ReportPayment(Guid id, [FromForm] SettlementPaymentForm form, CancellationToken cancellationToken)
    {
        if (ControllerContext.HttpContext is not null && string.IsNullOrWhiteSpace(Request.Headers["Idempotency-Key"].FirstOrDefault())) return BadRequest(new { message = "Envía Idempotency-Key." });
        if (form.File is null || form.File.Length == 0) return BadRequest(new { message = "Adjunta el comprobante del pago." });
        await using var stream = new MemoryStream();
        await form.File.CopyToAsync(stream, cancellationToken);
        return Ok(await _adminFinanceService.ReportSettlementPaymentAsync(id,
            new ReportSettlementPaymentRequest(form.OperationNumber, form.Amount, form.PaidAtUtc, stream.ToArray(), form.File.FileName, form.File.ContentType), cancellationToken));
    }

    [HttpGet("{id:guid}/payment-evidence")]
    public async Task<IActionResult> GetPaymentEvidence(Guid id, CancellationToken cancellationToken)
    {
        if (_storage is null) return Problem("El almacenamiento privado no está configurado.");
        var path = await _adminFinanceService.GetSettlementPaymentEvidencePathAsync(id, cancellationToken);
        return Redirect(await _storage.CreatePrivateDownloadUrlAsync(path, TimeSpan.FromMinutes(5), cancellationToken));
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        if (ControllerContext.HttpContext is not null && string.IsNullOrWhiteSpace(Request.Headers["Idempotency-Key"].FirstOrDefault())) return BadRequest(new { message = "Envía Idempotency-Key." });
        var response = await _adminFinanceService.CancelSettlementAsync(id, cancellationToken);
        return Ok(response);
    }
}

public sealed class SettlementPaymentForm
{
    public string OperationNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaidAtUtc { get; set; }
    public IFormFile File { get; set; } = null!;
}
