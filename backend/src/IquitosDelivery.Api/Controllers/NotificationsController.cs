using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Api.Controllers.Requests.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly IDeviceTokenService _deviceTokenService;
    private readonly INotificationService _notificationService;
    private readonly IWebHostEnvironment _environment;

    public NotificationsController(
        IDeviceTokenService deviceTokenService,
        INotificationService notificationService,
        IWebHostEnvironment environment)
    {
        _deviceTokenService = deviceTokenService;
        _notificationService = notificationService;
        _environment = environment;
    }

    [HttpPost("device-token")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RegisterDeviceToken([FromBody] RegisterDeviceTokenRequest request, CancellationToken cancellationToken)
    {
        await _deviceTokenService.RegisterAsync(
            new Application.DTOs.Notifications.RegisterDeviceTokenRequest
            {
                Token = request.Token,
                Platform = request.Platform,
                DeviceId = request.DeviceId,
                AppVersion = request.AppVersion
            },
            cancellationToken);

        return NoContent();
    }

    [HttpPost("device-token/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeactivateDeviceToken([FromBody] DeactivateDeviceTokenRequest request, CancellationToken cancellationToken)
    {
        await _deviceTokenService.DeactivateAsync(
            new Application.DTOs.Notifications.DeactivateDeviceTokenRequest
            {
                Token = request.Token
            },
            cancellationToken);

        return NoContent();
    }

    [HttpPost("test")]
    [ProducesResponseType(typeof(Application.DTOs.Notifications.TestPushNotificationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<Application.DTOs.Notifications.TestPushNotificationResponse>> SendTestNotification(
        [FromBody] TestPushNotificationRequest? request,
        CancellationToken cancellationToken)
    {
        var response = await _notificationService.SendTestNotificationToCurrentUserAsync(
            new Application.DTOs.Notifications.TestPushNotificationRequest
            {
                Title = request?.Title,
                Body = request?.Body,
                Data = request?.Data
            },
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("device-token/status")]
    [ProducesResponseType(typeof(Application.DTOs.Notifications.DeviceTokenStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<Application.DTOs.Notifications.DeviceTokenStatusResponse>> GetDeviceTokenStatus(
        CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var response = await _notificationService.GetCurrentUserTokenStatusAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet]
    [ProducesResponseType(typeof(Application.DTOs.Notifications.NotificationInboxResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<Application.DTOs.Notifications.NotificationInboxResponse>> GetInbox(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await _notificationService.GetInboxAsync(page, pageSize, cancellationToken));

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(Application.DTOs.Notifications.NotificationUnreadCountResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<Application.DTOs.Notifications.NotificationUnreadCountResponse>> GetUnreadCount(
        CancellationToken cancellationToken) =>
        Ok(await _notificationService.GetUnreadCountAsync(cancellationToken));

    [HttpPatch("{notificationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid notificationId, CancellationToken cancellationToken)
    {
        await _notificationService.MarkAsReadAsync(notificationId, cancellationToken);
        return NoContent();
    }

    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        await _notificationService.MarkAllAsReadAsync(cancellationToken);
        return NoContent();
    }
}
