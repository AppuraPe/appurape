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
    public async Task<ActionResult<IReadOnlyList<AvailableDriverOrderListItemResponse>>> GetAvailableOrders(
        [FromQuery] DriverAvailableOrderFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetAvailableOrdersAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<DriverOrderDetailResponse>> GetActiveOrder(CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetActiveOrderAsync(cancellationToken);

        return response is null ? NoContent() : Ok(response);
    }

    [HttpGet("available/{id:guid}")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> GetAvailableOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetAvailableOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetDriverOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/take")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> TakeOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.TakeOrderAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/accept")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> AcceptOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.TakeOrderAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IReadOnlyList<DriverAssignedOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DriverAssignedOrderListItemResponse>>> GetMyOrders(
        [FromQuery] DriverAssignedOrderFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.GetMyAssignedOrdersAsync(filters, cancellationToken);
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

    [HttpPost("{id:guid}/picked-up")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> MarkPickedUp(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.UpdateMyOrderStatusAsync(id, new UpdateDriverOrderStatusRequest { Status = Domain.Enums.OrderStatus.PickedUp }, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/on-the-way")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> MarkOnTheWay(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.UpdateMyOrderStatusAsync(id, new UpdateDriverOrderStatusRequest { Status = Domain.Enums.OrderStatus.OnTheWay }, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/delivered")]
    [ProducesResponseType(typeof(DriverOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverOrderDetailResponse>> MarkDelivered(Guid id, CancellationToken cancellationToken)
    {
        var response = await _driverOrderService.UpdateMyOrderStatusAsync(id, new UpdateDriverOrderStatusRequest { Status = Domain.Enums.OrderStatus.Delivered }, cancellationToken);
        return Ok(response);
    }
}
