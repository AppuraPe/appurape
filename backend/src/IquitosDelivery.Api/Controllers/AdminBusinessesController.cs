using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/businesses")]
[Authorize(Roles = "Admin")]
public class AdminBusinessesController : ControllerBase
{
    private readonly IAdminBusinessService _adminBusinessService;

    public AdminBusinessesController(IAdminBusinessService adminBusinessService)
    {
        _adminBusinessService = adminBusinessService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminBusinessListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminBusinessListItemResponse>>> GetBusinesses(
        [FromQuery] AdminBusinessFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.GetBusinessesAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingBusinessResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PendingBusinessResponse>>> GetPending(CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.GetPendingBusinessesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AdminBusinessDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminBusinessDetailResponse>> GetBusiness(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.GetBusinessByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AdminBusinessDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminBusinessDetailResponse>> UpdateStatus(
        Guid id,
        [FromBody] UpdateBusinessStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.UpdateBusinessStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/business-type")]
    [ProducesResponseType(typeof(AdminBusinessDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminBusinessDetailResponse>> UpdateBusinessType(
        Guid id,
        [FromBody] UpdateBusinessTypeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.UpdateBusinessTypeAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/approve")]
    [ProducesResponseType(typeof(PendingBusinessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PendingBusinessResponse>> Approve(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.ApproveBusinessAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/reject")]
    [ProducesResponseType(typeof(PendingBusinessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PendingBusinessResponse>> Reject(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminBusinessService.RejectBusinessAsync(id, cancellationToken);
        return Ok(response);
    }
}
