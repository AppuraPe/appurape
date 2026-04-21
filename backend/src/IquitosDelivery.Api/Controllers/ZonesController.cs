using IquitosDelivery.Application.DTOs.Zones;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/zones")]
public class ZonesController : ControllerBase
{
    private readonly IZoneService _zoneService;

    public ZonesController(IZoneService zoneService)
    {
        _zoneService = zoneService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ZoneResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ZoneResponse>>> GetZones(CancellationToken cancellationToken)
    {
        var response = await _zoneService.GetActiveZonesAsync(cancellationToken);
        return Ok(response);
    }
}
