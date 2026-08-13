using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public AdminOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(CustomerOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerOrderDetailResponse>> CancelOrder(
        Guid id,
        [FromBody] CancelOrderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _orderService.CancelAdminOrderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/delivery-confirmation/regenerate")]
    public async Task<ActionResult<object>> RegenerateDeliveryConfirmation(
        Guid id,
        [FromBody] AdminRegenerateOrderDeliveryCodeRequest request,
        [FromServices] IOrderDeliveryConfirmationService confirmationService,
        CancellationToken cancellationToken)
    {
        var result = await confirmationService.RegenerateForAdminAsync(id, request.Reason, cancellationToken);
        return Ok(new { result.OrderId, result.ExpiresAtUtc, Regenerated = true });
    }
}
