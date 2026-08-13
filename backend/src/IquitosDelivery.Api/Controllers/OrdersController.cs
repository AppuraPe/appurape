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
    private readonly IOrderFulfillmentService _fulfillmentService;

    public OrdersController(IOrderService orderService, IOrderFulfillmentService fulfillmentService)
    {
        _orderService = orderService;
        _fulfillmentService = fulfillmentService;
    }

    [HttpGet("my/{id:guid}/fulfillment-options")]
    public async Task<ActionResult<OrderFulfillmentOptionsResponse>> GetFulfillmentOptions(Guid id, CancellationToken cancellationToken) =>
        Ok(await _fulfillmentService.GetOptionsAsync(id, cancellationToken));

    [HttpGet("my/{id:guid}/delivery-confirmation")]
    public async Task<ActionResult<OrderDeliveryConfirmationResponse>> GetDeliveryConfirmation(
        Guid id, [FromServices] IOrderDeliveryConfirmationService confirmationService, CancellationToken cancellationToken) =>
        Ok(await confirmationService.GetForCustomerAsync(id, cancellationToken));

    [HttpPost("my/{id:guid}/delivery-confirmation/regenerate")]
    public async Task<ActionResult<OrderDeliveryConfirmationResponse>> RegenerateDeliveryConfirmation(
        Guid id, [FromServices] IOrderDeliveryConfirmationService confirmationService, CancellationToken cancellationToken) =>
        Ok(await confirmationService.RegenerateForCustomerAsync(id, cancellationToken));

    [HttpPost("my/{id:guid}/collaborator-pickup/quote")]
    public async Task<ActionResult<OrderCollaboratorPickupQuoteResponse>> QuoteCollaboratorPickup(
        Guid id,
        [FromBody] OrderCollaboratorPickupQuoteRequest request,
        CancellationToken cancellationToken) =>
        Ok(await _fulfillmentService.QuoteCollaboratorPickupAsync(id, request, cancellationToken));

    [HttpPost("my/{id:guid}/collaborator-pickup")]
    public async Task<ActionResult<OrderCollaboratorPickupResponse>> CreateCollaboratorPickup(
        Guid id,
        [FromBody] CreateOrderCollaboratorPickupRequest request,
        CancellationToken cancellationToken) =>
        Ok(await _fulfillmentService.CreateCollaboratorPickupAsync(id, request, cancellationToken));

    [HttpPost("my/{id:guid}/driver-delivery")]
    public async Task<ActionResult<OrderDriverDeliveryResponse>> RequestDriverDelivery(
        Guid id,
        [FromBody] RequestOrderDriverDeliveryRequest request,
        CancellationToken cancellationToken) =>
        Ok(await _fulfillmentService.RequestDriverDeliveryAsync(id, request, cancellationToken));

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

    [HttpPost("my/{id:guid}/cancel")]
    [ProducesResponseType(typeof(CustomerOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerOrderDetailResponse>> CancelMyOrder(
        Guid id,
        [FromBody] CancelOrderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.CancelMyOrderAsync(id, request, cancellationToken);
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
