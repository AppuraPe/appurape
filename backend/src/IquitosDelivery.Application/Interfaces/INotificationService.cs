using IquitosDelivery.Application.DTOs.Notifications;

namespace IquitosDelivery.Application.Interfaces;

public interface INotificationService
{
    Task SendToUserAsync(
        Guid userId,
        EventPushNotificationRequest request,
        CancellationToken cancellationToken = default);

    Task SendToUsersAsync(
        IEnumerable<Guid> userIds,
        EventPushNotificationRequest request,
        CancellationToken cancellationToken = default);

    Task<TestPushNotificationResponse> SendTestNotificationToCurrentUserAsync(
        TestPushNotificationRequest request,
        CancellationToken cancellationToken = default);

    Task<DeviceTokenStatusResponse> GetCurrentUserTokenStatusAsync(CancellationToken cancellationToken = default);
}
