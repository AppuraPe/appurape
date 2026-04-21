using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Drivers;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/drivers")]
[Authorize(Roles = "Admin")]
public class AdminDriversController : ControllerBase
{
    private readonly IAdminDriverService _adminDriverService;

    public AdminDriversController(IAdminDriverService adminDriverService)
    {
        _adminDriverService = adminDriverService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminDriverListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminDriverListItemResponse>>> GetDrivers(
        [FromQuery] AdminDriverFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _adminDriverService.GetDriversAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingDriverResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PendingDriverResponse>>> GetPending(CancellationToken cancellationToken)
    {
        var response = await _adminDriverService.GetPendingDriversAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AdminDriverDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDriverDetailResponse>> GetDriver(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminDriverService.GetDriverByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AdminDriverDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDriverDetailResponse>> UpdateStatus(
        Guid id,
        [FromBody] UpdateAdminEntityStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminDriverService.UpdateDriverStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/approve")]
    [ProducesResponseType(typeof(PendingDriverResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PendingDriverResponse>> Approve(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminDriverService.ApproveDriverAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/reject")]
    [ProducesResponseType(typeof(PendingDriverResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PendingDriverResponse>> Reject(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminDriverService.RejectDriverAsync(id, cancellationToken);
        return Ok(response);
    }
}
