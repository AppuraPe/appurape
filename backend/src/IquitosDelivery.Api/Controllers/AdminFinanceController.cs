using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/finance")]
[Authorize(Roles = "Admin")]
public class AdminFinanceController : ControllerBase
{
    private readonly IAdminFinanceService _adminFinanceService;

    public AdminFinanceController(IAdminFinanceService adminFinanceService)
    {
        _adminFinanceService = adminFinanceService;
    }

    [HttpGet("commission-rules")]
    [ProducesResponseType(typeof(IReadOnlyList<CommissionRuleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CommissionRuleResponse>>> GetCommissionRules(CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetCommissionRulesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPatch("commission-rules/{id:guid}")]
    [ProducesResponseType(typeof(CommissionRuleResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CommissionRuleResponse>> UpdateCommissionRule(
        Guid id,
        [FromBody] UpdateCommissionRuleRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.UpdateCommissionRuleAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("movements")]
    [ProducesResponseType(typeof(IReadOnlyList<FinancialMovementResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FinancialMovementResponse>>> GetFinancialMovements(
        [FromQuery] FinancialMovementFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetFinancialMovementsAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("commissions/summary")]
    [ProducesResponseType(typeof(AdminCommissionSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminCommissionSummaryResponse>> GetCommissionSummary(CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetCommissionSummaryAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("movements/{id:guid}/waive")]
    [ProducesResponseType(typeof(FinancialMovementResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<FinancialMovementResponse>> WaiveMovement(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.WaiveMovementAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("settlements")]
    [ProducesResponseType(typeof(IReadOnlyList<SettlementBatchResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SettlementBatchResponse>>> GetSettlements(CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetSettlementsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("settlements/{id:guid}")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> GetSettlement(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetSettlementByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost("settlements")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> CreateSettlement(
        [FromBody] CreateSettlementBatchRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.CreateSettlementAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("settlements/{id:guid}/mark-paid")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> MarkSettlementPaid(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.MarkSettlementPaidAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost("settlements/{id:guid}/cancel")]
    [ProducesResponseType(typeof(SettlementBatchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettlementBatchResponse>> CancelSettlement(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.CancelSettlementAsync(id, cancellationToken);
        return Ok(response);
    }
}
