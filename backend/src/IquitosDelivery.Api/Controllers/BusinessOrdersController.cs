using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.DTOs.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/business/orders")]
[Authorize(Roles = "Restaurant")]
public class BusinessOrdersController : ControllerBase
{
    private readonly IBusinessOrderService _businessOrderService;

    public BusinessOrdersController(IBusinessOrderService businessOrderService)
    {
        _businessOrderService = businessOrderService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BusinessOrderListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BusinessOrderListItemResponse>>> GetOrders(
        [FromQuery] BusinessOrderFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _businessOrderService.GetBusinessOrdersAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BusinessOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessOrderDetailResponse>> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        var response = await _businessOrderService.GetBusinessOrderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(BusinessOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessOrderDetailResponse>> UpdateStatus(Guid id, [FromBody] BusinessOrderStatusUpdateRequest request, CancellationToken cancellationToken)
    {
        var response = await _businessOrderService.UpdateBusinessOrderStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(BusinessOrderDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<BusinessOrderDetailResponse>> CancelOrder(
        Guid id,
        [FromBody] CancelOrderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _businessOrderService.CancelBusinessOrderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/dispatch")]
    public async Task<ActionResult<BusinessOrderDetailResponse>> Dispatch(Guid id, CancellationToken cancellationToken) =>
        Ok(await _businessOrderService.DispatchBusinessDeliveryAsync(id, cancellationToken));

    [HttpPost("{id:guid}/confirm-delivery")]
    public async Task<ActionResult<BusinessOrderDetailResponse>> ConfirmDelivery(Guid id, [FromBody] ConfirmOrderDeliveryRequest request, CancellationToken cancellationToken) =>
        Ok(await _businessOrderService.ConfirmBusinessDeliveryAsync(id, request, cancellationToken));
}
