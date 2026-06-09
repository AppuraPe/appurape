using IquitosDelivery.Application.DTOs.Community;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/community")]
public class AdminCommunityController : ControllerBase
{
    private readonly IAdminCommunityService _adminCommunityService;

    public AdminCommunityController(IAdminCommunityService adminCommunityService)
    {
        _adminCommunityService = adminCommunityService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<CommunityAdminOverviewResponse>> GetOverview(CancellationToken cancellationToken)
    {
        return Ok(await _adminCommunityService.GetOverviewAsync(cancellationToken));
    }

    [HttpGet("collaborators")]
    public async Task<ActionResult<IReadOnlyList<CommunityCollaboratorResponse>>> GetCollaborators(CancellationToken cancellationToken)
    {
        return Ok(await _adminCommunityService.GetCollaboratorsAsync(cancellationToken));
    }

    [HttpGet("requests")]
    public async Task<ActionResult<IReadOnlyList<CommunityRequestListItemResponse>>> GetRequests(CancellationToken cancellationToken)
    {
        return Ok(await _adminCommunityService.GetRequestsAsync(cancellationToken));
    }
}
