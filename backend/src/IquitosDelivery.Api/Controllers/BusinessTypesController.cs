using IquitosDelivery.Application.DTOs.Businesses;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/business-types")]
public class BusinessTypesController : ControllerBase
{
    private readonly IBusinessTypeService _businessTypeService;

    public BusinessTypesController(IBusinessTypeService businessTypeService)
    {
        _businessTypeService = businessTypeService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BusinessTypeListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BusinessTypeListItemResponse>>> GetBusinessTypes(CancellationToken cancellationToken)
    {
        var response = await _businessTypeService.GetActiveBusinessTypesAsync(cancellationToken);
        return Ok(response);
    }
}
