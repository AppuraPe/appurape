using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/collaborator/verification")]
[Authorize]
public class CollaboratorVerificationController : ControllerBase
{
    private readonly ICollaboratorVerificationService _verificationService;

    public CollaboratorVerificationController(ICollaboratorVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(CollaboratorVerificationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CollaboratorVerificationResponse>> GetMine(CancellationToken cancellationToken)
    {
        var response = await _verificationService.GetMineAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("request")]
    [ProducesResponseType(typeof(CollaboratorVerificationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CollaboratorVerificationResponse>> RequestVerification(CancellationToken cancellationToken)
    {
        var response = await _verificationService.RequestVerificationAsync(cancellationToken);
        return Ok(response);
    }
}
