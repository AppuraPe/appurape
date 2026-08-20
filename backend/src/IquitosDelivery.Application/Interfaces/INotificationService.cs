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

    Task<NotificationInboxResponse> GetInboxAsync(int page, int pageSize, bool unreadOnly = false, CancellationToken cancellationToken = default);

    Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default);

    Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default);

    Task MarkAllAsReadAsync(CancellationToken cancellationToken = default);
}
