using IquitosDelivery.Application.DTOs.CustomerAddresses;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/customer/addresses")]
[Authorize(Roles = "Customer")]
public class CustomerAddressesController : ControllerBase
{
    private readonly ICustomerAddressService _customerAddressService;

    public CustomerAddressesController(ICustomerAddressService customerAddressService)
    {
        _customerAddressService = customerAddressService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerAddressResponse>>> GetMyAddresses(CancellationToken cancellationToken)
    {
        return Ok(await _customerAddressService.GetMyAddressesAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerAddressResponse>> GetMyAddress(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _customerAddressService.GetMyAddressByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<CustomerAddressResponse>> CreateMyAddress(
        [FromBody] UpsertCustomerAddressRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _customerAddressService.CreateMyAddressAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetMyAddress), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CustomerAddressResponse>> UpdateMyAddress(
        Guid id,
        [FromBody] UpsertCustomerAddressRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _customerAddressService.UpdateMyAddressAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMyAddress(Guid id, CancellationToken cancellationToken)
    {
        await _customerAddressService.DeleteMyAddressAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/set-default")]
    public async Task<ActionResult<CustomerAddressResponse>> SetDefault(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _customerAddressService.SetDefaultAsync(id, cancellationToken));
    }
}
