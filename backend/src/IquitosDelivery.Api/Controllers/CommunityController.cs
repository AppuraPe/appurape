using IquitosDelivery.Api.Controllers.Requests.Community;
using IquitosDelivery.Application.DTOs.Community;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/community")]
public class CommunityController : ControllerBase
{
    private readonly ICommunityService _communityService;
    private readonly IFileStorageService _fileStorageService;

    public CommunityController(ICommunityService communityService, IFileStorageService fileStorageService)
    {
        _communityService = communityService;
        _fileStorageService = fileStorageService;
    }

    [HttpGet("collaborator/me")]
    public async Task<ActionResult<CommunityCollaboratorResponse>> GetMyCollaborator(CancellationToken cancellationToken)
    {
        return Ok(await _communityService.GetMyCollaboratorProfileAsync(cancellationToken));
    }

    [HttpPatch("collaborator/me")]
    public async Task<ActionResult<CommunityCollaboratorResponse>> UpdateMyCollaborator(
        [FromBody] UpdateCommunityCollaboratorRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.UpdateMyCollaboratorProfileAsync(request, cancellationToken));
    }

    [HttpGet("routes/me")]
    public async Task<ActionResult<IReadOnlyList<CommunityRouteResponse>>> GetMyRoutes(CancellationToken cancellationToken)
    {
        return Ok(await _communityService.GetMyRoutesAsync(cancellationToken));
    }

    [HttpPost("routes/me")]
    public async Task<ActionResult<CommunityRouteResponse>> CreateMyRoute(
        [FromBody] UpsertCommunityRouteRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.UpsertMyRouteAsync(null, request, cancellationToken));
    }

    [HttpPut("routes/me/{routeId:guid}")]
    public async Task<ActionResult<CommunityRouteResponse>> UpdateMyRoute(
        Guid routeId,
        [FromBody] UpsertCommunityRouteRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.UpsertMyRouteAsync(routeId, request, cancellationToken));
    }

    [HttpGet("requests")]
    public async Task<ActionResult<IReadOnlyList<CommunityRequestListItemResponse>>> GetRequests(
        [FromQuery] CommunityRequestQueryRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.GetRequestsAsync(request, cancellationToken));
    }

    [HttpPost("requests")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> CreateRequest(
        [FromBody] CreateCommunityRequestRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.CreateRequestAsync(request, cancellationToken));
    }

    [HttpPost("requests/quote")]
    public async Task<ActionResult<CommunityRequestQuoteResponse>> QuoteRequest(
        [FromBody] CreateCommunityRequestRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.QuoteRequestAsync(request, cancellationToken));
    }

    [HttpGet("requests/{requestId:guid}")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> GetRequestById(Guid requestId, CancellationToken cancellationToken)
    {
        return Ok(await _communityService.GetRequestByIdAsync(requestId, cancellationToken));
    }

    [HttpGet("requests/{requestId:guid}/matches")]
    public async Task<ActionResult<IReadOnlyList<CommunityRequestMatchResponse>>> GetRequestMatches(Guid requestId, CancellationToken cancellationToken)
    {
        return Ok(await _communityService.GetRequestMatchesAsync(requestId, cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/apply")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> ApplyToRequest(Guid requestId, CancellationToken cancellationToken)
    {
        return Ok(await _communityService.ApplyToRequestAsync(requestId, cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/select")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> SelectApplication(
        Guid requestId,
        [FromBody] SelectCommunityRequestApplicationRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.SelectApplicationAsync(requestId, request, cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/accept")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> AcceptRequest(Guid requestId, CancellationToken cancellationToken)
    {
        return Ok(await _communityService.AcceptRequestAsync(requestId, cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/start")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> StartRequest(Guid requestId, CancellationToken cancellationToken)
    {
        return Ok(await _communityService.StartRequestAsync(requestId, cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/complete")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> CompleteRequest(
        Guid requestId,
        [FromForm] CompleteCommunityRequestFormRequest request,
        CancellationToken cancellationToken)
    {
        var proofImageUrl = await FileUploadHelper.UploadImageAsync(
            _fileStorageService,
            request.ProofImageFile,
            $"community/requests/{requestId}/proof",
            cancellationToken);

        return Ok(await _communityService.CompleteRequestAsync(
            requestId,
            new CompleteCommunityRequestRequest { ConfirmationCode = request.ConfirmationCode },
            proofImageUrl,
            cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/confirm")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> ConfirmRequest(Guid requestId, CancellationToken cancellationToken)
    {
        return Ok(await _communityService.ConfirmRequestAsync(requestId, cancellationToken));
    }

    [HttpPost("requests/{requestId:guid}/confirmation-code/regenerate")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> RegenerateConfirmationCode(Guid requestId, CancellationToken cancellationToken) =>
        Ok(await _communityService.RegenerateConfirmationCodeAsync(requestId, cancellationToken));

    [HttpPatch("requests/{requestId:guid}/cancel")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> CancelRequest(
        Guid requestId,
        [FromBody] CancelCommunityRequestRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.CancelRequestAsync(requestId, request, cancellationToken));
    }

    [HttpPatch("requests/{requestId:guid}/rating")]
    public async Task<ActionResult<CommunityRequestDetailResponse>> RateCollaborator(
        Guid requestId,
        [FromBody] RateCommunityCollaboratorRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _communityService.RateCollaboratorAsync(requestId, request, cancellationToken));
    }
}
