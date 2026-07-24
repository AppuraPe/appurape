using IquitosDelivery.Api.Controllers;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Moq;

namespace IquitosDelivery.Tests;

public class NotificationsControllerTests
{
    [Fact]
    public void NotificationsController_RequiresAuthorization()
    {
        var authorizeAttribute = typeof(NotificationsController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true);
        Assert.NotEmpty(authorizeAttribute);
    }

    [Fact]
    public async Task SendTestNotification_ReturnsOkAndCallsOnlyAuthenticatedUsersService()
    {
        var deviceTokenService = Mock.Of<IDeviceTokenService>();
        var notificationService = new Mock<INotificationService>(MockBehavior.Strict);
        notificationService
            .Setup(x => x.SendTestNotificationToCurrentUserAsync(It.IsAny<IquitosDelivery.Application.DTOs.Notifications.TestPushNotificationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TestPushNotificationResponse
            {
                TokensFound = 1,
                SentOk = 1,
                Failed = 0,
                Deactivated = 0,
                Message = "ok"
            });

        var environment = Mock.Of<IWebHostEnvironment>(x => x.EnvironmentName == Environments.Development);
        var controller = new NotificationsController(deviceTokenService, notificationService.Object, environment);

        var result = await controller.SendTestNotification(new IquitosDelivery.Api.Controllers.Requests.Notifications.TestPushNotificationRequest(), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        notificationService.Verify(
            x => x.SendTestNotificationToCurrentUserAsync(It.IsAny<IquitosDelivery.Application.DTOs.Notifications.TestPushNotificationRequest>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetDeviceTokenStatus_OutsideDevelopment_ReturnsNotFound()
    {
        var controller = new NotificationsController(
            Mock.Of<IDeviceTokenService>(),
            Mock.Of<INotificationService>(),
            Mock.Of<IWebHostEnvironment>(x => x.EnvironmentName == Environments.Production));

        var result = await controller.GetDeviceTokenStatus(CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }
}
