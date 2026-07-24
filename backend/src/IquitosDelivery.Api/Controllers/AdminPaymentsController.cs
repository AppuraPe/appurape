using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "Admin")]
public class AdminPaymentsController : ControllerBase
{
    private readonly IAdminPaymentService _adminPaymentService;

    public AdminPaymentsController(IAdminPaymentService adminPaymentService)
    {
        _adminPaymentService = adminPaymentService;
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminPaymentListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminPaymentListItemResponse>>> GetPending(CancellationToken cancellationToken)
    {
        var response = await _adminPaymentService.GetPendingPaymentsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{orderId:guid}")]
    [ProducesResponseType(typeof(AdminPaymentDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminPaymentDetailResponse>> GetPayment(Guid orderId, CancellationToken cancellationToken)
    {
        var response = await _adminPaymentService.GetPaymentByOrderIdAsync(orderId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{orderId:guid}/confirm")]
    [ProducesResponseType(typeof(AdminPaymentDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminPaymentDetailResponse>> ConfirmPayment(Guid orderId, CancellationToken cancellationToken)
    {
        var response = await _adminPaymentService.ConfirmPaymentAsync(orderId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{orderId:guid}/reject")]
    [ProducesResponseType(typeof(AdminPaymentDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminPaymentDetailResponse>> RejectPayment(Guid orderId, CancellationToken cancellationToken)
    {
        var response = await _adminPaymentService.RejectPaymentAsync(orderId, cancellationToken);
        return Ok(response);
    }
}
