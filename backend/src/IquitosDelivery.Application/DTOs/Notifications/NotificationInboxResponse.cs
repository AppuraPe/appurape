namespace IquitosDelivery.Application.DTOs.Notifications;

public sealed class NotificationInboxResponse
{
    public IReadOnlyList<NotificationInboxItemResponse> Items { get; set; } = [];

    public int Page { get; set; }

    public int PageSize { get; set; }

    public bool HasMore { get; set; }

    public int UnreadCount { get; set; }
}

public sealed class NotificationInboxItemResponse
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string? EventType { get; set; }

    public string? TargetRoute { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ReadAtUtc { get; set; }
}

public sealed class NotificationUnreadCountResponse
{
    public int UnreadCount { get; set; }
}
