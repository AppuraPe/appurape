using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/collaborator-verifications")]
[Authorize(Roles = "Admin")]
public class AdminCollaboratorVerificationsController : ControllerBase
{
    private readonly ICollaboratorVerificationService _verificationService;

    public AdminCollaboratorVerificationsController(ICollaboratorVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CollaboratorVerificationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CollaboratorVerificationResponse>>> GetPending(CancellationToken cancellationToken)
    {
        var response = await _verificationService.GetPendingAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(CollaboratorVerificationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CollaboratorVerificationResponse>> Approve(Guid id, CancellationToken cancellationToken)
    {
        var response = await _verificationService.ApproveAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(CollaboratorVerificationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CollaboratorVerificationResponse>> Reject(
        Guid id,
        [FromBody] RejectCollaboratorVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _verificationService.RejectAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
