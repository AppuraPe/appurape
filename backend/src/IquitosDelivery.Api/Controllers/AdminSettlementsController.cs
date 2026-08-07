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

    public AdminSettlementsController(IAdminFinanceService adminFinanceService)
    {
        _adminFinanceService = adminFinanceService;
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
        var response = await _adminFinanceService.CreateSettlementAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/mark-paid")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> MarkPaid(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.MarkSettlementPaidAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.CancelSettlementAsync(id, cancellationToken);
        return Ok(response);
    }
}
