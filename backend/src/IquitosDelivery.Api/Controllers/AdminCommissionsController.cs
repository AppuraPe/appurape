using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/commissions")]
[Authorize(Roles = "Admin")]
public class AdminCommissionsController : ControllerBase
{
    private readonly IAdminFinanceService _adminFinanceService;

    public AdminCommissionsController(IAdminFinanceService adminFinanceService)
    {
        _adminFinanceService = adminFinanceService;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(AdminCommissionSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminCommissionSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetCommissionSummaryAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("movements")]
    [ProducesResponseType(typeof(IReadOnlyList<FinancialMovementResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FinancialMovementResponse>>> GetMovements(
        [FromQuery] FinancialMovementFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetFinancialMovementsAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("businesses/{businessId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<FinancialMovementResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FinancialMovementResponse>>> GetBusinessMovements(
        Guid businessId,
        CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.GetFinancialMovementsAsync(
            new FinancialMovementFilterRequest { RestaurantId = businessId },
            cancellationToken);
        return Ok(response);
    }

    [HttpPost("movements/{id:guid}/waive")]
    [ProducesResponseType(typeof(FinancialMovementResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<FinancialMovementResponse>> WaiveMovement(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminFinanceService.WaiveMovementAsync(id, cancellationToken);
        return Ok(response);
    }
}
