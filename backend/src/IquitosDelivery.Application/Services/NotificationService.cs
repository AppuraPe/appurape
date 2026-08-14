using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace IquitosDelivery.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPushNotificationSender _pushNotificationSender;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IPushNotificationSender pushNotificationSender,
        ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _pushNotificationSender = pushNotificationSender;
        _logger = logger;
    }

    public async Task SendToUserAsync(
        Guid userId,
        EventPushNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        await SendToUsersAsync([userId], request, cancellationToken);
    }

    public async Task SendToUsersAsync(
        IEnumerable<Guid> userIds,
        EventPushNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var targetUserIds = userIds
            .Where(x => x != Guid.Empty)
            .Distinct()
            .ToArray();

        if (targetUserIds.Length == 0)
        {
            return;
        }

        try
        {
            var normalizedTitle = request.Title.Trim();
            var normalizedBody = request.Body.Trim();

            if (string.IsNullOrWhiteSpace(normalizedTitle) || string.IsNullOrWhiteSpace(normalizedBody))
            {
                _logger.LogWarning("Skipping notification because title or body is empty.");
                return;
            }

            var payload = MergeEventData(request.Data);
            var eventType = payload.GetValueOrDefault("event") ?? payload.GetValueOrDefault("type");
            var targetRoute = payload.GetValueOrDefault("targetRoute");

            foreach (var userId in targetUserIds)
            {
                _dbContext.Add(new UserNotification
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Title = normalizedTitle,
                    Body = normalizedBody,
                    EventType = Truncate(eventType, 80),
                    TargetRoute = Truncate(targetRoute, 500),
                    DataJson = JsonSerializer.Serialize(payload)
                });
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (!_pushNotificationSender.IsConfigured)
            {
                _logger.LogInformation(
                    "Notification history persisted for {UserCount} users; push delivery skipped because Firebase is disabled or not configured.",
                    targetUserIds.Length);
                return;
            }
            var activeTokens = await _dbContext.UserDeviceTokens
                .Where(x => targetUserIds.Contains(x.UserId) && x.IsActive)
                .OrderByDescending(x => x.LastSeenAtUtc)
                .ToListAsync(cancellationToken);

            if (activeTokens.Count == 0)
            {
                return;
            }

            var shouldPersistTokenChanges = false;

            foreach (var deviceToken in activeTokens)
            {
                var result = await _pushNotificationSender.SendToTokenAsync(
                    deviceToken.Token,
                    normalizedTitle,
                    normalizedBody,
                    payload,
                    cancellationToken);

                if (result.IsConfigurationError)
                {
                    _logger.LogInformation(
                        "Skipping push notification delivery because Firebase is not configured: {ErrorMessage}",
                        result.ErrorMessage ?? _pushNotificationSender.ConfigurationError ?? "unknown");
                    return;
                }

                if (result.IsSuccess)
                {
                    continue;
                }

                _logger.LogWarning(
                    "Push notification delivery failed for user {UserId}. ErrorCode={ErrorCode} Deactivate={DeactivateToken}",
                    deviceToken.UserId,
                    result.ErrorCode ?? "unknown",
                    result.ShouldDeactivateToken);

                if (!result.ShouldDeactivateToken)
                {
                    continue;
                }

                deviceToken.IsActive = false;
                deviceToken.LastSeenAtUtc = DateTime.UtcNow;
                shouldPersistTokenChanges = true;
            }

            if (shouldPersistTokenChanges)
            {
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Push event notification failed but the main operation will continue.");
        }
    }

    public async Task<TestPushNotificationResponse> SendTestNotificationToCurrentUserAsync(
        TestPushNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var activeTokens = await _dbContext.UserDeviceTokens
            .Where(x => x.UserId == userId && x.IsActive)
            .OrderByDescending(x => x.LastSeenAtUtc)
            .ToListAsync(cancellationToken);

        if (activeTokens.Count == 0)
        {
            return new TestPushNotificationResponse
            {
                TokensFound = 0,
                SentOk = 0,
                Failed = 0,
                Deactivated = 0,
                Message = "No hay tokens activos para este usuario."
            };
        }

        if (!_pushNotificationSender.IsConfigured)
        {
            throw new AppException(_pushNotificationSender.ConfigurationError ?? "Firebase push no está configurado.");
        }

        var title = string.IsNullOrWhiteSpace(request.Title) ? "AppuraPe" : request.Title.Trim();
        var body = string.IsNullOrWhiteSpace(request.Body) ? "Notificación de prueba" : request.Body.Trim();
        var payload = MergeTestData(request.Data);

        var sentOk = 0;
        var failed = 0;
        var deactivated = 0;

        foreach (var deviceToken in activeTokens)
        {
            var result = await _pushNotificationSender.SendToTokenAsync(
                deviceToken.Token,
                title,
                body,
                payload,
                cancellationToken);

            if (result.IsConfigurationError)
            {
                throw new AppException(result.ErrorMessage ?? "Firebase push no está configurado.");
            }

            if (result.IsSuccess)
            {
                sentOk += 1;
                continue;
            }

            failed += 1;

            if (!result.ShouldDeactivateToken)
            {
                continue;
            }

            deviceToken.IsActive = false;
            deviceToken.LastSeenAtUtc = DateTime.UtcNow;
            deactivated += 1;
        }

        if (deactivated > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new TestPushNotificationResponse
        {
            TokensFound = activeTokens.Count,
            SentOk = sentOk,
            Failed = failed,
            Deactivated = deactivated,
            Message = sentOk > 0
                ? "Notificación de prueba procesada."
                : "No se pudo enviar la notificación de prueba."
        };
    }

    public async Task<DeviceTokenStatusResponse> GetCurrentUserTokenStatusAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var tokens = await _dbContext.UserDeviceTokens
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);

        return new DeviceTokenStatusResponse
        {
            ActiveTokens = tokens.Count(x => x.IsActive),
            InactiveTokens = tokens.Count(x => !x.IsActive),
            Platforms = tokens
                .Select(x => x.Platform)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(x => x)
                .ToArray()
        };
    }

    public async Task<NotificationInboxResponse> GetInboxAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _dbContext.UserNotifications
            .AsNoTracking()
            .Where(x => x.UserId == userId);
        var unreadCount = await query.CountAsync(x => x.ReadAtUtc == null, cancellationToken);
        var rows = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize + 1)
            .Select(x => new NotificationInboxItemResponse
            {
                Id = x.Id,
                Title = x.Title,
                Body = x.Body,
                EventType = x.EventType,
                TargetRoute = x.TargetRoute,
                CreatedAtUtc = x.CreatedAtUtc,
                ReadAtUtc = x.ReadAtUtc
            })
            .ToListAsync(cancellationToken);

        return new NotificationInboxResponse
        {
            Items = rows.Take(pageSize).ToArray(),
            Page = page,
            PageSize = pageSize,
            HasMore = rows.Count > pageSize,
            UnreadCount = unreadCount
        };
    }

    public async Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        return new NotificationUnreadCountResponse
        {
            UnreadCount = await _dbContext.UserNotifications
                .CountAsync(x => x.UserId == userId && x.ReadAtUtc == null, cancellationToken)
        };
    }

    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var notification = await _dbContext.UserNotifications
            .FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("Notificación no encontrada.");

        if (notification.ReadAtUtc.HasValue)
        {
            return;
        }

        notification.ReadAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var unread = await _dbContext.UserNotifications
            .Where(x => x.UserId == userId && x.ReadAtUtc == null)
            .ToListAsync(cancellationToken);
        if (unread.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var notification in unread)
        {
            notification.ReadAtUtc = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new UnauthorizedException("Authentication is required.");
    }

    private static IReadOnlyDictionary<string, string> MergeTestData(IReadOnlyDictionary<string, string>? data)
    {
        return MergeData(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["type"] = "test"
            },
            data);
    }

    private static IReadOnlyDictionary<string, string> MergeEventData(IReadOnlyDictionary<string, string>? data)
    {
        return MergeData(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase), data);
    }

    private static IReadOnlyDictionary<string, string> MergeData(
        IDictionary<string, string> defaults,
        IReadOnlyDictionary<string, string>? data)
    {
        defaults["source"] = "appurape";

        if (data is null)
        {
            return new Dictionary<string, string>(defaults, StringComparer.OrdinalIgnoreCase);
        }

        foreach (var item in data)
        {
            if (string.IsNullOrWhiteSpace(item.Key))
            {
                continue;
            }

            defaults[item.Key.Trim()] = item.Value?.Trim() ?? string.Empty;
        }

        return new Dictionary<string, string>(defaults, StringComparer.OrdinalIgnoreCase);
    }

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }
}
