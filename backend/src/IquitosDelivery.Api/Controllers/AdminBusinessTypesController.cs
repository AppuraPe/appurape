using IquitosDelivery.Application.DTOs.Businesses;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/business-types")]
[Authorize(Roles = "Admin")]
public class AdminBusinessTypesController : ControllerBase
{
    private readonly IAdminBusinessTypeService _adminBusinessTypeService;

    public AdminBusinessTypesController(IAdminBusinessTypeService adminBusinessTypeService)
    {
        _adminBusinessTypeService = adminBusinessTypeService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminBusinessTypeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminBusinessTypeResponse>>> GetBusinessTypes(CancellationToken cancellationToken)
    {
        var response = await _adminBusinessTypeService.GetBusinessTypesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminBusinessTypeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminBusinessTypeResponse>> CreateBusinessType(
        [FromBody] UpsertAdminBusinessTypeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminBusinessTypeService.CreateBusinessTypeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AdminBusinessTypeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminBusinessTypeResponse>> UpdateBusinessType(
        Guid id,
        [FromBody] UpsertAdminBusinessTypeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminBusinessTypeService.UpdateBusinessTypeAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AdminBusinessTypeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminBusinessTypeResponse>> UpdateBusinessTypeStatus(
        Guid id,
        [FromBody] UpdateBusinessTypeStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminBusinessTypeService.UpdateBusinessTypeStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
