using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize(Roles = "Customer")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("validate")]
    [ProducesResponseType(typeof(ValidateOrderResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ValidateOrderResponse>> ValidateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var response = await _orderService.ValidateOrderAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CustomerOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerOrderDetailResponse>> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var response = await _orderService.CreateOrderAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IReadOnlyList<CustomerOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CustomerOrderListItemResponse>>> GetMyOrders(CancellationToken cancellationToken)
    {
        var response = await _orderService.GetMyOrdersAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("my/{id:guid}")]
    [ProducesResponseType(typeof(CustomerOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerOrderDetailResponse>> GetMyOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _orderService.GetMyOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("my/{id:guid}/driver-rating")]
    [ProducesResponseType(typeof(CustomerOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerOrderDetailResponse>> RateDriver(
        Guid id,
        [FromBody] RateDriverRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.RateDriverAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
