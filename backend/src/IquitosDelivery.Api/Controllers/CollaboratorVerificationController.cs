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
    private readonly IFileStorageService _fileStorageService;
    private readonly ILegalService _legalService;

    public CollaboratorVerificationController(ICollaboratorVerificationService verificationService, IFileStorageService fileStorageService, ILegalService legalService)
    {
        _verificationService = verificationService;
        _fileStorageService = fileStorageService;
        _legalService = legalService;
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

    [HttpPost("submit")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CollaboratorVerificationResponse>> Submit([FromForm] SubmitCollaboratorVerificationForm request, CancellationToken cancellationToken)
    {
        await _legalService.EnsureAudienceAcceptedAsync("Collaborator", cancellationToken);
        if (request.ProfilePhoto is null || request.IdentityDocument is null || request.LiveSelfie is null)
            return BadRequest(new { message = "Foto de perfil, DNI y selfie en vivo son obligatorios." });

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new UnauthorizedAccessException();
        var prefix = $"collaborator-verifications/{userId}/{Guid.NewGuid():N}";
        var profileUrl = await FileUploadHelper.UploadImageAsync(_fileStorageService, request.ProfilePhoto, $"profiles/{userId}/photo", cancellationToken)
            ?? throw new InvalidOperationException();
        var dniPath = await UploadPrivateAsync(request.IdentityDocument, $"{prefix}/dni", cancellationToken);
        var selfiePath = await UploadPrivateAsync(request.LiveSelfie, $"{prefix}/live-selfie", cancellationToken);
        return Ok(await _verificationService.SubmitVerificationAsync(profileUrl, dniPath, selfiePath, cancellationToken));
    }

    private async Task<string> UploadPrivateAsync(IFormFile file, string path, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        return await _fileStorageService.UploadPrivateImageAsync(stream, file.FileName, file.ContentType, file.Length, path, cancellationToken);
    }
}

public sealed class SubmitCollaboratorVerificationForm
{
    public IFormFile? ProfilePhoto { get; set; }
    public IFormFile? IdentityDocument { get; set; }
    public IFormFile? LiveSelfie { get; set; }
}
