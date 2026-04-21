using IquitosDelivery.Application.DTOs.Drivers;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/driver/orders")]
[Authorize(Roles = "Driver")]
public class DriverOrdersController : ControllerBase
{
    private readonly IDriverOrderService _driverOrderService;

    public DriverOrdersController(IDriverOrderService driverOrderService)
    {
        _driverOrderService = driverOrderService;
    }

    [HttpGet("available")]
    [ProducesResponseType(typeof(IReadOnlyList<AvailableDriverOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AvailableDriverOrderListItemResponse>>> GetAvailableOrders(CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetAvailableOrdersAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("available/{id:guid}")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> GetAvailableOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetAvailableOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/take")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> TakeOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.TakeOrderAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IReadOnlyList<DriverAssignedOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DriverAssignedOrderListItemResponse>>> GetMyOrders(CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetMyAssignedOrdersAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("my/{id:guid}")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> GetMyOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetMyOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("my/{id:guid}/status")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> UpdateMyOrderStatus(Guid id, [FromBody] UpdateDriverOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.UpdateMyOrderStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
