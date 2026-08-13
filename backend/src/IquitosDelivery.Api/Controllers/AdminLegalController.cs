using IquitosDelivery.Application.DTOs.Legal;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/legal")]
[Authorize(Roles = "Admin")]
public sealed class AdminLegalController : ControllerBase
{
    private readonly ILegalService _legalService;
    public AdminLegalController(ILegalService legalService) => _legalService = legalService;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LegalDocumentResponse>>> GetAll(CancellationToken cancellationToken) => Ok(await _legalService.GetAllAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<LegalDocumentResponse>> Create(CreateLegalDocumentRequest request, CancellationToken cancellationToken) => Ok(await _legalService.CreateDraftAsync(request, cancellationToken));

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<LegalDocumentResponse>> Publish(Guid id, CancellationToken cancellationToken) => Ok(await _legalService.PublishAsync(id, cancellationToken));
}
