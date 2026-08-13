using IquitosDelivery.Application.DTOs.Account;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/account/deletion")]
public sealed class AccountDeletionController : ControllerBase
{
    private readonly IAccountDeletionService _service;
    public AccountDeletionController(IAccountDeletionService service) => _service = service;
    [HttpPost("start"), AllowAnonymous]
    public async Task<IActionResult> Start(StartAccountDeletionRequest request, CancellationToken cancellationToken) { await _service.StartAsync(request, cancellationToken); return Ok(new { message = "Si la cuenta existe, enviaremos un código al correo." }); }
    [HttpPost("confirm"), AllowAnonymous]
    public async Task<ActionResult<AccountDeletionStatusResponse>> Confirm(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken) => Ok(await _service.ConfirmAsync(request, cancellationToken));
    [HttpGet("status"), Authorize]
    public async Task<ActionResult<AccountDeletionStatusResponse>> Status(CancellationToken cancellationToken) => Ok(await _service.GetStatusAsync(cancellationToken));
    [HttpPost("cancel"), Authorize]
    public async Task<ActionResult<AccountDeletionStatusResponse>> Cancel(CancellationToken cancellationToken) => Ok(await _service.CancelAsync(cancellationToken));
    [HttpPost("cancel/start"), AllowAnonymous]
    public async Task<IActionResult> StartCancellation(StartAccountDeletionRequest request, CancellationToken cancellationToken) { await _service.StartCancellationAsync(request, cancellationToken); return Ok(new { message = "Si existe una eliminación pendiente, enviaremos un código." }); }
    [HttpPost("cancel/confirm"), AllowAnonymous]
    public async Task<ActionResult<AccountDeletionStatusResponse>> CancelWithCode(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken) => Ok(await _service.CancelWithCodeAsync(request, cancellationToken));
}
