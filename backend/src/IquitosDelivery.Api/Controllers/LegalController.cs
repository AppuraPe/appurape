using IquitosDelivery.Application.DTOs.Legal;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/legal")]
public sealed class LegalController : ControllerBase
{
    private readonly ILegalService _legalService;
    public LegalController(ILegalService legalService) => _legalService = legalService;

    [HttpGet("documents/active")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<LegalDocumentResponse>>> GetActive([FromQuery] string role, CancellationToken cancellationToken) =>
        Ok(await _legalService.GetActiveDocumentsAsync(role, cancellationToken));

    [HttpGet("documents/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<LegalDocumentResponse>> GetBySlug(string slug, CancellationToken cancellationToken) =>
        Ok(await _legalService.GetPublishedBySlugAsync(slug, cancellationToken));

    [HttpGet("consent-status")]
    [Authorize]
    public async Task<ActionResult<LegalConsentStatusResponse>> GetStatus(CancellationToken cancellationToken) =>
        Ok(await _legalService.GetConsentStatusAsync(cancellationToken));

    [HttpPost("acceptances")]
    [Authorize]
    public async Task<ActionResult<LegalConsentStatusResponse>> Accept(AcceptLegalDocumentsRequest request, CancellationToken cancellationToken) =>
        Ok(await _legalService.AcceptAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString(), cancellationToken));
}
