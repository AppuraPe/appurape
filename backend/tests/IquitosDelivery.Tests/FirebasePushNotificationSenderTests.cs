using System.Reflection;
using System.Text.Json;
using IquitosDelivery.Infrastructure.Push;

namespace IquitosDelivery.Tests;

public class FirebasePushNotificationSenderTests
{
    [Fact]
    public void BuildPayload_UsesAndroidChannelExpectedByTheOperationsApp()
    {
        var buildPayload = typeof(FirebasePushNotificationSender).GetMethod(
            "BuildPayload",
            BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(buildPayload);

        var payload = buildPayload.Invoke(
            null,
            [
                "fcm-token",
                "Pedido listo",
                "Puedes continuar con la entrega.",
                new Dictionary<string, string> { ["targetRoute"] = "/driver/orders/123" }
            ]);
        var json = JsonSerializer.SerializeToElement(payload);
        var message = json.GetProperty("message");

        Assert.Equal("fcm-token", message.GetProperty("token").GetString());
        Assert.Equal("HIGH", message.GetProperty("android").GetProperty("priority").GetString());
        Assert.Equal(
            "appurape_default",
            message.GetProperty("android").GetProperty("notification").GetProperty("channel_id").GetString());
        Assert.Equal("/driver/orders/123", message.GetProperty("data").GetProperty("targetRoute").GetString());
    }
}
