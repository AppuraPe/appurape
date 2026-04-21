using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/restaurant/orders")]
[Authorize(Roles = "Restaurant")]
public class RestaurantOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public RestaurantOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RestaurantOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RestaurantOrderListItemResponse>>> GetOrders(CancellationToken cancellationToken)
    {
        var response = await _orderService.GetRestaurantOrdersAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RestaurantOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderDetailResponse>> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _orderService.GetRestaurantOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(RestaurantOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderDetailResponse>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var response = await _orderService.UpdateRestaurantOrderStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
