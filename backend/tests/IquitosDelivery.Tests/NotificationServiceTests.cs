using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace IquitosDelivery.Tests;

public class NotificationServiceTests
{
    [Fact]
    public async Task SendTestNotification_NoActiveTokens_ReturnsEmptySummary()
    {
        await using var dbContext = CreateDbContext();
        var userId = await SeedUserAsync(dbContext, UserRole.Customer, "no-tokens@appurape.test");
        var service = CreateService(dbContext, new TestCurrentUserService(userId), new FakePushNotificationSender(isConfigured: true));

        var response = await service.SendTestNotificationToCurrentUserAsync(new TestPushNotificationRequest());

        Assert.Equal(0, response.TokensFound);
        Assert.Equal(0, response.SentOk);
        Assert.Equal("No hay tokens activos para este usuario.", response.Message);
    }

    [Fact]
    public async Task SendTestNotification_UsesOnlyCurrentUsersActiveTokens_AndSendsSuccessfully()
    {
        await using var dbContext = CreateDbContext();
        var currentUserId = await SeedUserAsync(dbContext, UserRole.Customer, "push-owner@appurape.test");
        var otherUserId = await SeedUserAsync(dbContext, UserRole.Driver, "push-other@appurape.test");

        dbContext.AddRange(
            CreateToken(currentUserId, UserRole.Customer, "active-a", true),
            CreateToken(currentUserId, UserRole.Customer, "active-b", true),
            CreateToken(currentUserId, UserRole.Customer, "inactive-a", false),
            CreateToken(otherUserId, UserRole.Driver, "other-active", true));

        await dbContext.SaveChangesAsync();

        var sender = new FakePushNotificationSender(isConfigured: true);
        var service = CreateService(dbContext, new TestCurrentUserService(currentUserId), sender);

        var response = await service.SendTestNotificationToCurrentUserAsync(new TestPushNotificationRequest
        {
            Title = "Prueba",
            Body = "Hola",
            Data = new Dictionary<string, string> { ["custom"] = "1" }
        });

        Assert.Equal(2, response.TokensFound);
        Assert.Equal(2, response.SentOk);
        Assert.Equal(0, response.Failed);
        Assert.Equal(0, response.Deactivated);
        Assert.Equal(2, sender.Calls.Count);
        Assert.DoesNotContain(sender.Calls, x => x.Token == "other-active");
        Assert.All(sender.Calls, call =>
        {
            Assert.Equal("Prueba", call.Title);
            Assert.Equal("Hola", call.Body);
            Assert.Equal("test", call.Data["type"]);
            Assert.Equal("appurape", call.Data["source"]);
            Assert.Equal("1", call.Data["custom"]);
        });
    }

    [Fact]
    public async Task SendTestNotification_InvalidToken_DeactivatesToken()
    {
        await using var dbContext = CreateDbContext();
        var userId = await SeedUserAsync(dbContext, UserRole.Restaurant, "invalid-token@appurape.test");

        dbContext.Add(CreateToken(userId, UserRole.Restaurant, "bad-token", true));
        await dbContext.SaveChangesAsync();

        var sender = new FakePushNotificationSender(isConfigured: true);
        sender.Results["bad-token"] = new PushSendResult
        {
            IsSuccess = false,
            ShouldDeactivateToken = true,
            ErrorCode = "UNREGISTERED",
            ErrorMessage = "Token no registrado."
        };

        var service = CreateService(dbContext, new TestCurrentUserService(userId), sender);
        var response = await service.SendTestNotificationToCurrentUserAsync(new TestPushNotificationRequest());
        var token = await dbContext.UserDeviceTokens.AsNoTracking().SingleAsync();

        Assert.Equal(1, response.TokensFound);
        Assert.Equal(0, response.SentOk);
        Assert.Equal(1, response.Failed);
        Assert.Equal(1, response.Deactivated);
        Assert.False(token.IsActive);
    }

    [Fact]
    public async Task SendTestNotification_WhenSenderNotConfigured_ThrowsControlledError()
    {
        await using var dbContext = CreateDbContext();
        var userId = await SeedUserAsync(dbContext, UserRole.Admin, "config@appurape.test");
        dbContext.Add(CreateToken(userId, UserRole.Admin, "config-token", true));
        await dbContext.SaveChangesAsync();

        var service = CreateService(
            dbContext,
            new TestCurrentUserService(userId),
            new FakePushNotificationSender(isConfigured: false, configurationError: "Firebase push no está configurado."));

        var exception = await Assert.ThrowsAsync<IquitosDelivery.Application.Exceptions.AppException>(() =>
            service.SendTestNotificationToCurrentUserAsync(new TestPushNotificationRequest()));

        Assert.Equal("Firebase push no está configurado.", exception.Message);
    }

    [Fact]
    public async Task SendEventNotification_WhenSenderNotConfigured_DoesNotThrow()
    {
        await using var dbContext = CreateDbContext();
        var userId = await SeedUserAsync(dbContext, UserRole.Customer, "event-disabled@appurape.test");
        dbContext.Add(CreateToken(userId, UserRole.Customer, "event-token", true));
        await dbContext.SaveChangesAsync();

        var service = CreateService(
            dbContext,
            new TestCurrentUserService(userId),
            new FakePushNotificationSender(isConfigured: false, configurationError: "Firebase push está deshabilitado."));

        await service.SendToUserAsync(
            userId,
            new EventPushNotificationRequest
            {
                Title = "Evento",
                Body = "No debe romper",
                Data = new Dictionary<string, string> { ["type"] = "order" }
            });

        var token = await dbContext.UserDeviceTokens.AsNoTracking().SingleAsync();
        Assert.True(token.IsActive);
        var history = await dbContext.UserNotifications.AsNoTracking().SingleAsync();
        Assert.Equal(userId, history.UserId);
        Assert.Equal("Evento", history.Title);
        Assert.Equal("order", history.EventType);
        Assert.Null(history.ReadAtUtc);
    }

    [Fact]
    public async Task Inbox_OnlyReturnsCurrentUsersNotifications_AndSupportsReadState()
    {
        await using var dbContext = CreateDbContext();
        var currentUserId = await SeedUserAsync(dbContext, UserRole.Customer, "inbox@appurape.test");
        var otherUserId = await SeedUserAsync(dbContext, UserRole.Customer, "other-inbox@appurape.test");
        dbContext.Add(new UserNotification
        {
            Id = Guid.NewGuid(), UserId = currentUserId, Title = "Tu pedido está listo", Body = "Puedes recogerlo.", TargetRoute = "/orders/1"
        });
        dbContext.Add(new UserNotification
        {
            Id = Guid.NewGuid(), UserId = otherUserId, Title = "Privada", Body = "No debe aparecer."
        });
        await dbContext.SaveChangesAsync();
        var service = CreateService(dbContext, new TestCurrentUserService(currentUserId), new FakePushNotificationSender(true));

        var inbox = await service.GetInboxAsync(1, 20);
        Assert.Single(inbox.Items);
        Assert.Equal(1, inbox.UnreadCount);

        await service.MarkAsReadAsync(inbox.Items[0].Id);
        Assert.Equal(0, (await service.GetUnreadCountAsync()).UnreadCount);
    }

    [Fact]
    public async Task MarkAllAsRead_DoesNotModifyAnotherUsersNotifications()
    {
        await using var dbContext = CreateDbContext();
        var currentUserId = await SeedUserAsync(dbContext, UserRole.Driver, "driver-inbox@appurape.test");
        var otherUserId = await SeedUserAsync(dbContext, UserRole.Restaurant, "business-inbox@appurape.test");
        dbContext.Add(new UserNotification { Id = Guid.NewGuid(), UserId = currentUserId, Title = "Asignado", Body = "Tienes una entrega." });
        dbContext.Add(new UserNotification { Id = Guid.NewGuid(), UserId = otherUserId, Title = "Pedido", Body = "Tienes un pedido." });
        await dbContext.SaveChangesAsync();
        var service = CreateService(dbContext, new TestCurrentUserService(currentUserId), new FakePushNotificationSender(true));

        await service.MarkAllAsReadAsync();

        Assert.NotNull((await dbContext.UserNotifications.SingleAsync(x => x.UserId == currentUserId)).ReadAtUtc);
        Assert.Null((await dbContext.UserNotifications.SingleAsync(x => x.UserId == otherUserId)).ReadAtUtc);
    }

    private static NotificationService CreateService(
        AppDbContext dbContext,
        ICurrentUserService currentUserService,
        IPushNotificationSender sender)
    {
        return new NotificationService(
            dbContext,
            currentUserService,
            sender,
            NullLogger<NotificationService>.Instance);
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static async Task<Guid> SeedUserAsync(AppDbContext dbContext, UserRole role, string email)
    {
        var userId = Guid.NewGuid();
        dbContext.Users.Add(new User
        {
            Id = userId,
            FirstName = role.ToString(),
            LastName = "Push",
            Phone = "900000100",
            Email = email,
            PasswordHash = "hash",
            Role = role,
            Status = UserStatus.Active
        });

        await dbContext.SaveChangesAsync();
        return userId;
    }

    private static UserDeviceToken CreateToken(Guid userId, UserRole role, string token, bool isActive)
    {
        return new UserDeviceToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Role = role,
            Token = token,
            Platform = "android",
            IsActive = isActive,
            LastSeenAtUtc = DateTime.UtcNow
        };
    }

    private sealed class TestCurrentUserService(Guid userId) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "push@appurape.test";

        public string? Role => UserRole.Customer.ToString();

        public bool IsAuthenticated => true;
    }

    private sealed class FakePushNotificationSender : IPushNotificationSender
    {
        public FakePushNotificationSender(bool isConfigured, string? configurationError = null)
        {
            IsConfigured = isConfigured;
            ConfigurationError = configurationError;
        }

        public bool IsConfigured { get; }

        public string? ConfigurationError { get; }

        public Dictionary<string, PushSendResult> Results { get; } = new(StringComparer.Ordinal);

        public List<(string Token, string Title, string Body, IReadOnlyDictionary<string, string> Data)> Calls { get; } = [];

        public Task<PushSendResult> SendToTokenAsync(
            string token,
            string title,
            string body,
            IReadOnlyDictionary<string, string>? data,
            CancellationToken cancellationToken = default)
        {
            Calls.Add((token, title, body, data ?? new Dictionary<string, string>()));
            return Task.FromResult(
                Results.TryGetValue(token, out var result)
                    ? result
                    : new PushSendResult { IsSuccess = true, ProviderMessageId = "mock-id" });
        }
    }
}
