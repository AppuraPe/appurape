using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/restaurants")]
[Authorize(Roles = "Admin")]
public class AdminRestaurantsController : ControllerBase
{
    private readonly IAdminRestaurantService _adminRestaurantService;

    public AdminRestaurantsController(IAdminRestaurantService adminRestaurantService)
    {
        _adminRestaurantService = adminRestaurantService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminRestaurantListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminRestaurantListItemResponse>>> GetRestaurants(
        [FromQuery] AdminRestaurantFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _adminRestaurantService.GetRestaurantsAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingRestaurantResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PendingRestaurantResponse>>> GetPending(CancellationToken cancellationToken)
    {
        var response = await _adminRestaurantService.GetPendingRestaurantsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AdminRestaurantDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminRestaurantDetailResponse>> GetRestaurant(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminRestaurantService.GetRestaurantByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AdminRestaurantDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminRestaurantDetailResponse>> UpdateStatus(
        Guid id,
        [FromBody] UpdateAdminEntityStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminRestaurantService.UpdateRestaurantStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/approve")]
    [ProducesResponseType(typeof(PendingRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PendingRestaurantResponse>> Approve(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminRestaurantService.ApproveRestaurantAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/reject")]
    [ProducesResponseType(typeof(PendingRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PendingRestaurantResponse>> Reject(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminRestaurantService.RejectRestaurantAsync(id, cancellationToken);
        return Ok(response);
    }
}
