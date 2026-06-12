using IquitosDelivery.Api.Controllers.Requests.Admin;
using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/platform-settings")]
[Authorize(Roles = "Admin")]
public class AdminPlatformSettingsController : ControllerBase
{
    private readonly IAdminPlatformSettingsService _platformSettingsService;
    private readonly IFileStorageService _fileStorageService;

    public AdminPlatformSettingsController(
        IAdminPlatformSettingsService platformSettingsService,
        IFileStorageService fileStorageService)
    {
        _platformSettingsService = platformSettingsService;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PlatformSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PlatformSettingsResponse>> Get(CancellationToken cancellationToken)
    {
        var response = await _platformSettingsService.GetSettingsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(PlatformSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PlatformSettingsResponse>> Update(
        [FromForm] UpdatePlatformSettingsFormRequest request,
        CancellationToken cancellationToken)
    {
        var currentSettings = await _platformSettingsService.GetSettingsAsync(cancellationToken);

        var logoUrl = request.LogoUrl?.Trim();
        if (request.LogoFile is not null && request.LogoFile.Length > 0)
        {
            logoUrl = await FileUploadHelper.UploadImageAsync(
                _fileStorageService,
                request.LogoFile,
                BuildBrandingObjectPath("logo", request.LogoFile.FileName),
                cancellationToken);
        }

        var appIconUrl = request.AppIconUrl?.Trim();
        if (request.AppIconFile is not null && request.AppIconFile.Length > 0)
        {
            appIconUrl = await FileUploadHelper.UploadImageAsync(
                _fileStorageService,
                request.AppIconFile,
                BuildBrandingObjectPath("app-icon", request.AppIconFile.FileName),
                cancellationToken);
        }

        var splashImageUrl = request.SplashImageUrl?.Trim();
        if (request.SplashImageFile is not null && request.SplashImageFile.Length > 0)
        {
            splashImageUrl = await FileUploadHelper.UploadImageAsync(
                _fileStorageService,
                request.SplashImageFile,
                BuildBrandingObjectPath("splash", request.SplashImageFile.FileName),
                cancellationToken);
        }

        var response = await _platformSettingsService.UpdateSettingsAsync(new UpdatePlatformSettingsRequest
        {
            AppName = request.AppName,
            Tagline = request.Tagline,
            LogoUrl = logoUrl,
            AppIconUrl = appIconUrl,
            SplashImageUrl = splashImageUrl,
            PrimaryColor = request.PrimaryColor,
            SecondaryColor = request.SecondaryColor,
            SupportEmail = request.SupportEmail,
            SupportPhone = request.SupportPhone
        }, cancellationToken);

        await DeleteIfReplacedAsync(currentSettings.LogoUrl, response.LogoUrl, request.LogoFile, cancellationToken);
        await DeleteIfReplacedAsync(currentSettings.AppIconUrl, response.AppIconUrl, request.AppIconFile, cancellationToken);
        await DeleteIfReplacedAsync(currentSettings.SplashImageUrl, response.SplashImageUrl, request.SplashImageFile, cancellationToken);

        return Ok(response);
    }

    private async Task DeleteIfReplacedAsync(string? previousUrl, string? nextUrl, IFormFile? newFile, CancellationToken cancellationToken)
    {
        if (newFile is null || newFile.Length == 0 || string.IsNullOrWhiteSpace(previousUrl))
        {
            return;
        }

        if (string.Equals(previousUrl, nextUrl, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await _fileStorageService.DeleteByPublicUrlAsync(previousUrl, cancellationToken);
    }

    private static string BuildBrandingObjectPath(string assetType, string fileName)
    {
        var extension = Path.GetExtension(fileName)?.Trim();
        var normalizedExtension = string.IsNullOrWhiteSpace(extension) ? string.Empty : extension.ToLowerInvariant();
        return $"platform/branding/{assetType}/{Guid.NewGuid():N}{normalizedExtension}";
    }
}
