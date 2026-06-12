using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/platform-settings")]
public class PlatformSettingsController : ControllerBase
{
    private readonly IPlatformSettingsService _platformSettingsService;

    public PlatformSettingsController(IPlatformSettingsService platformSettingsService)
    {
        _platformSettingsService = platformSettingsService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PlatformSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PlatformSettingsResponse>> Get(CancellationToken cancellationToken)
    {
        var response = await _platformSettingsService.GetPublicSettingsAsync(cancellationToken);
        return Ok(response);
    }
}
