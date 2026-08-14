namespace IquitosDelivery.Application.Common;

public static class NotificationPayloadFactory
{
    public static IReadOnlyDictionary<string, string> Order(Guid orderId, string targetRoute, string eventName)
    {
        return Create("order", "orderId", orderId, targetRoute, eventName);
    }

    public static IReadOnlyDictionary<string, string> BusinessOrder(Guid orderId, string targetRoute, string eventName)
    {
        return Create("business_order", "orderId", orderId, targetRoute, eventName);
    }

    public static IReadOnlyDictionary<string, string> DriverOrder(Guid orderId, string targetRoute, string eventName)
    {
        return Create("driver_order", "orderId", orderId, targetRoute, eventName);
    }

    public static IReadOnlyDictionary<string, string> AdminPayment(Guid orderId, string targetRoute, string eventName)
    {
        return Create("admin_payment", "orderId", orderId, targetRoute, eventName);
    }

    public static IReadOnlyDictionary<string, string> CommunityRequest(Guid requestId, string targetRoute, string eventName)
    {
        return Create("community_request", "requestId", requestId, targetRoute, eventName);
    }

    private static IReadOnlyDictionary<string, string> Create(
        string type,
        string idKey,
        Guid entityId,
        string targetRoute,
        string eventName)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["type"] = type,
            [idKey] = entityId.ToString(),
            ["targetRoute"] = targetRoute,
            ["event"] = eventName
        };
    }
}
