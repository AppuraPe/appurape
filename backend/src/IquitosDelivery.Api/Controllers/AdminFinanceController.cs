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
}
