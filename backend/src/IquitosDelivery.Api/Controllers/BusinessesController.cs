using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.DTOs.Businesses;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/businesses")]
public class BusinessesController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly IBusinessService _businessService;

    public BusinessesController(IBusinessService businessService, ICatalogService catalogService)
    {
        _businessService = businessService;
        _catalogService = catalogService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BusinessListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BusinessListItemResponse>>> GetBusinesses(
        [FromQuery] PublicBusinessFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _businessService.GetPublicBusinessesAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("mobile-home")]
    [ProducesResponseType(typeof(PublicBusinessMobileHomeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PublicBusinessMobileHomeResponse>> GetMobileHome(CancellationToken cancellationToken)
    {
        var response = await _businessService.GetPublicBusinessMobileHomeAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BusinessDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessDetailResponse>> GetBusiness(Guid id, CancellationToken cancellationToken)
    {
        var response = await _businessService.GetPublicBusinessDetailAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}/catalog")]
    [ProducesResponseType(typeof(CatalogResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogResponse>> GetPublicCatalog(
        Guid id,
        [FromQuery] CatalogFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _catalogService.GetPublicCatalogAsync(id, filters, cancellationToken);
        return Ok(response);
    }
}
