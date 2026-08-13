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
    private readonly IOrderFulfillmentService _fulfillmentService;

    public RestaurantOrdersController(IOrderService orderService, IOrderFulfillmentService fulfillmentService)
    {
        _orderService = orderService;
        _fulfillmentService = fulfillmentService;
    }

    [HttpPost("{orderId:guid}/collaborator-pickup/confirm")]
    public async Task<ActionResult<OrderCollaboratorPickupResponse>> ConfirmCollaboratorPickup(
        Guid orderId,
        [FromBody] ConfirmCollaboratorPickupRequest request,
        CancellationToken cancellationToken) =>
        Ok(await _fulfillmentService.ConfirmBusinessPickupAsync(orderId, request, cancellationToken));

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RestaurantOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RestaurantOrderListItemResponse>>> GetOrders(
        [FromQuery] RestaurantOrderFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.GetRestaurantOrdersAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RestaurantOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderDetailResponse>> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _orderService.GetRestaurantOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{orderId:guid}/payment")]
    [ProducesResponseType(typeof(RestaurantOrderPaymentResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderPaymentResponse>> GetPayment(Guid orderId, CancellationToken cancellationToken)
    {
        var response = await _orderService.GetRestaurantOrderPaymentAsync(orderId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{orderId:guid}/payment/confirm")]
    [ProducesResponseType(typeof(RestaurantOrderPaymentResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderPaymentResponse>> ConfirmPayment(
        Guid orderId,
        [FromBody] ConfirmRestaurantOrderPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.ConfirmRestaurantOrderPaymentAsync(orderId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{orderId:guid}/payment/reject")]
    [ProducesResponseType(typeof(RestaurantOrderPaymentResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderPaymentResponse>> RejectPayment(
        Guid orderId,
        [FromBody] RejectRestaurantOrderPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.RejectRestaurantOrderPaymentAsync(orderId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(RestaurantOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderDetailResponse>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var response = await _orderService.UpdateRestaurantOrderStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(RestaurantOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantOrderDetailResponse>> CancelOrder(
        Guid id,
        [FromBody] CancelOrderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.CancelRestaurantOrderAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
