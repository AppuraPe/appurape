using FluentValidation;
using IquitosDelivery.Application.DTOs.CustomerAddresses;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Application.Validators;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;

namespace IquitosDelivery.Tests;

public class CustomerAddressServiceTests
{
    [Fact]
    public async Task Customer_Creates_FirstAddress_AsDefault()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCustomerAddressFixtureAsync(dbContext);
        var service = CreateCustomerAddressService(dbContext, fixture.CustomerUserId);

        var result = await service.CreateMyAddressAsync(new UpsertCustomerAddressRequest
        {
            Label = "Casa",
            RecipientName = "Cliente Demo",
            RecipientPhone = "900000001",
            AddressLine = "Av. Primera 123",
            Reference = "Puerta verde",
            ZoneId = fixture.PrimaryZoneId
        });

        Assert.True(result.IsDefault);
        Assert.Equal("Casa", result.Label);
    }

    [Fact]
    public async Task Customer_Lists_OnlyOwnActiveAddresses()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCustomerAddressFixtureAsync(dbContext);
        await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.PrimaryZoneId, "Casa", true, true);
        await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.SecondaryZoneId, "Trabajo", false, false);
        await SeedAddressAsync(dbContext, fixture.OtherCustomerId, fixture.SecondaryZoneId, "Ajena", true, true);

        var service = CreateCustomerAddressService(dbContext, fixture.CustomerUserId);
        var result = await service.GetMyAddressesAsync();

        Assert.Single(result);
        Assert.Equal("Casa", result[0].Label);
    }

    [Fact]
    public async Task Customer_CannotAccess_ForeignAddress()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCustomerAddressFixtureAsync(dbContext);
        var foreignAddress = await SeedAddressAsync(dbContext, fixture.OtherCustomerId, fixture.PrimaryZoneId, "Ajena", true, true);
        var service = CreateCustomerAddressService(dbContext, fixture.CustomerUserId);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetMyAddressByIdAsync(foreignAddress.Id));
    }

    [Fact]
    public async Task Customer_Updates_OwnAddress()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCustomerAddressFixtureAsync(dbContext);
        var address = await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.PrimaryZoneId, "Casa", true, true);
        var service = CreateCustomerAddressService(dbContext, fixture.CustomerUserId);

        var result = await service.UpdateMyAddressAsync(address.Id, new UpsertCustomerAddressRequest
        {
            Label = "Trabajo",
            RecipientName = "Cliente Editado",
            RecipientPhone = "900000101",
            AddressLine = "Jr. Editado 456",
            Reference = "Segundo piso",
            ZoneId = fixture.SecondaryZoneId
        });

        Assert.Equal("Trabajo", result.Label);
        Assert.Equal("Cliente Editado", result.RecipientName);
        Assert.Equal(fixture.SecondaryZoneId, result.ZoneId);
    }

    [Fact]
    public async Task Customer_Deletes_DefaultAddress_AndPromotesAnother()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCustomerAddressFixtureAsync(dbContext);
        var firstAddress = await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.PrimaryZoneId, "Casa", true, true);
        var secondAddress = await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.SecondaryZoneId, "Trabajo", false, true);
        var service = CreateCustomerAddressService(dbContext, fixture.CustomerUserId);

        await service.DeleteMyAddressAsync(firstAddress.Id);
        var addresses = await service.GetMyAddressesAsync();

        Assert.Single(addresses);
        Assert.Equal(secondAddress.Id, addresses[0].Id);
        Assert.True(addresses[0].IsDefault);
    }

    [Fact]
    public async Task Customer_SetDefault_LeavesOnlyOneDefault()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCustomerAddressFixtureAsync(dbContext);
        var firstAddress = await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.PrimaryZoneId, "Casa", true, true);
        var secondAddress = await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.SecondaryZoneId, "Trabajo", false, true);
        var service = CreateCustomerAddressService(dbContext, fixture.CustomerUserId);

        await service.SetDefaultAsync(secondAddress.Id);
        var addresses = await service.GetMyAddressesAsync();

        Assert.Equal(secondAddress.Id, addresses.Single(x => x.IsDefault).Id);
        Assert.False(addresses.Single(x => x.Id == firstAddress.Id).IsDefault);
    }

    [Fact]
    public async Task Order_Create_WithManualAddress_RemainsCompatible()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedOrderFixtureAsync(dbContext);
        var service = CreateOrderService(dbContext, fixture.CustomerUserId);

        var order = await service.CreateOrderAsync(new CreateOrderRequest
        {
            ClientRequestId = Guid.NewGuid().ToString("N"),
            RestaurantId = fixture.RestaurantId,
            ZoneId = fixture.PrimaryZoneId,
            DeliveryAddress = "Av. Manual 123",
            DeliveryReference = "Frente al parque",
            PaymentMethod = PaymentMethod.Cash,
            Items =
            [
                new CreateOrderItemRequest
                {
                    MenuItemId = fixture.MenuItemId,
                    Quantity = 2,
                    ClientUnitPrice = 12.5m
                }
            ]
        });

        Assert.Equal("Av. Manual 123", order.DeliveryAddress);
        Assert.Equal("Frente al parque", order.DeliveryReference);
    }

    [Fact]
    public async Task Order_Create_WithSavedAddress_UsesStoredAddressAndZone()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedOrderFixtureAsync(dbContext);
        var savedAddress = await SeedAddressAsync(dbContext, fixture.CustomerId, fixture.SecondaryZoneId, "Casa", true, true);
        savedAddress.AddressLine = "Av. Guardada 456";
        savedAddress.Reference = "Portón azul";
        savedAddress.RecipientName = "Cliente Guardado";
        savedAddress.RecipientPhone = "900000707";
        await dbContext.SaveChangesAsync();

        var service = CreateOrderService(dbContext, fixture.CustomerUserId);

        var order = await service.CreateOrderAsync(new CreateOrderRequest
        {
            ClientRequestId = Guid.NewGuid().ToString("N"),
            RestaurantId = fixture.RestaurantId,
            CustomerAddressId = savedAddress.Id,
            ZoneId = fixture.PrimaryZoneId,
            DeliveryAddress = "Manual que no debe quedar",
            DeliveryReference = "Manual que no debe quedar",
            PaymentMethod = PaymentMethod.Cash,
            Items =
            [
                new CreateOrderItemRequest
                {
                    MenuItemId = fixture.MenuItemId,
                    Quantity = 1,
                    ClientUnitPrice = 12.5m
                }
            ]
        });

        Assert.Equal("Av. Guardada 456", order.DeliveryAddress);
        Assert.Equal("Portón azul", order.DeliveryReference);

        var persistedOrder = await dbContext.Orders.AsNoTracking().FirstAsync(x => x.Id == Guid.Parse(order.Id.ToString()));
        Assert.Equal(fixture.SecondaryZoneId, persistedOrder.ZoneId);
    }

    [Fact]
    public async Task Order_Create_Cash_NotifiesBusiness()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedOrderFixtureAsync(dbContext);
        var notificationService = new Mock<INotificationService>(MockBehavior.Strict);
        notificationService
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.Is<EventPushNotificationRequest>(request =>
                    request.Data != null &&
                    request.Data["type"] == "business_order" &&
                    request.Data["targetRoute"]!.Contains("/business/orders/")),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateOrderService(dbContext, fixture.CustomerUserId, notificationService.Object);

        await service.CreateOrderAsync(new CreateOrderRequest
        {
            ClientRequestId = Guid.NewGuid().ToString("N"),
            RestaurantId = fixture.RestaurantId,
            ZoneId = fixture.PrimaryZoneId,
            DeliveryAddress = "Av. Manual 123",
            DeliveryReference = "Frente al parque",
            PaymentMethod = PaymentMethod.Cash,
            Items =
            [
                new CreateOrderItemRequest
                {
                    MenuItemId = fixture.MenuItemId,
                    Quantity = 1,
                    ClientUnitPrice = 12.5m
                }
            ]
        });

        notificationService.VerifyAll();
    }

    private static AppDbContext CreateDbContext(string? databaseName = null)
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString("N"))
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options);
    }

    private static CustomerAddressService CreateCustomerAddressService(AppDbContext dbContext, Guid userId)
    {
        return new CustomerAddressService(
            dbContext,
            new TestCurrentUserService(userId, "Customer"),
            new UpsertCustomerAddressRequestValidator());
    }

    private static OrderService CreateOrderService(AppDbContext dbContext, Guid userId, INotificationService? notificationService = null)
    {
        return new OrderService(
            dbContext,
            new TestCurrentUserService(userId, "Customer"),
            notificationService ?? Mock.Of<INotificationService>(),
            new CreateOrderRequestValidator(),
            Mock.Of<IValidator<ConfirmRestaurantOrderPaymentRequest>>(),
            Mock.Of<IValidator<RateDriverRequest>>(),
            Mock.Of<IValidator<RejectRestaurantOrderPaymentRequest>>(),
            new UpdateOrderStatusRequestValidator());
    }

    private static async Task<(Guid CustomerUserId, Guid CustomerId, Guid OtherCustomerId, Guid PrimaryZoneId, Guid SecondaryZoneId)> SeedCustomerAddressFixtureAsync(AppDbContext dbContext)
    {
        var primaryZoneId = Guid.NewGuid();
        var secondaryZoneId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var otherCustomerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var otherCustomerId = Guid.NewGuid();

        dbContext.Zones.AddRange(
            new Zone { Id = primaryZoneId, Name = "Belén", DeliveryFee = 5m, IsActive = true },
            new Zone { Id = secondaryZoneId, Name = "Iquitos", DeliveryFee = 7m, IsActive = true });

        dbContext.Users.AddRange(
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Demo",
                Phone = "900000001",
                Email = "customer-address@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            },
            new User
            {
                Id = otherCustomerUserId,
                FirstName = "Otro",
                LastName = "Cliente",
                Phone = "900000002",
                Email = "other-address@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            });

        dbContext.Customers.AddRange(
            new CustomerProfile { Id = customerId, UserId = customerUserId },
            new CustomerProfile { Id = otherCustomerId, UserId = otherCustomerUserId });

        await dbContext.SaveChangesAsync();

        return (customerUserId, customerId, otherCustomerId, primaryZoneId, secondaryZoneId);
    }

    private static async Task<CustomerAddress> SeedAddressAsync(
        AppDbContext dbContext,
        Guid customerId,
        Guid zoneId,
        string label,
        bool isDefault,
        bool isActive)
    {
        var address = new CustomerAddress
        {
            Id = Guid.NewGuid(),
            CustomerProfileId = customerId,
            ZoneId = zoneId,
            Label = label,
            RecipientName = $"{label} receptor",
            RecipientPhone = "900000009",
            AddressLine = $"{label} 123",
            Reference = $"{label} referencia",
            IsDefault = isDefault,
            IsActive = isActive
        };

        dbContext.CustomerAddresses.Add(address);
        await dbContext.SaveChangesAsync();
        return address;
    }

    private static async Task<(Guid CustomerUserId, Guid CustomerId, Guid RestaurantId, Guid MenuItemId, Guid PrimaryZoneId, Guid SecondaryZoneId)> SeedOrderFixtureAsync(AppDbContext dbContext)
    {
        var primaryZoneId = Guid.NewGuid();
        var secondaryZoneId = Guid.NewGuid();
        var customerUserId = Guid.NewGuid();
        var restaurantOwnerUserId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var menuItemId = Guid.NewGuid();

        dbContext.Zones.AddRange(
            new Zone { Id = primaryZoneId, Name = "Belén", DeliveryFee = 5m, IsActive = true },
            new Zone { Id = secondaryZoneId, Name = "Punchana", DeliveryFee = 9m, IsActive = true });

        dbContext.Users.AddRange(
            new User
            {
                Id = customerUserId,
                FirstName = "Cliente",
                LastName = "Pedido",
                Phone = "900000010",
                Email = "customer-order@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Customer,
                Status = UserStatus.Active
            },
            new User
            {
                Id = restaurantOwnerUserId,
                FirstName = "Dueño",
                LastName = "Negocio",
                Phone = "900000011",
                Email = "owner-order@appurape.test",
                PasswordHash = "hash",
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            });

        dbContext.Customers.Add(new CustomerProfile
        {
            Id = customerId,
            UserId = customerUserId
        });

        dbContext.Restaurants.Add(new Restaurant
        {
            Id = restaurantId,
            OwnerUserId = restaurantOwnerUserId,
            Name = "Resto Direcciones",
            Description = "Demo",
            Address = "Av. Negocio 123",
            Reference = "Frente a la plaza",
            ZoneId = primaryZoneId,
            ApprovalStatus = ApprovalStatus.Approved,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = true
        });

        dbContext.MenuCategories.Add(new MenuCategory
        {
            Id = categoryId,
            RestaurantId = restaurantId,
            Name = "Entradas",
            IsActive = true,
            SortOrder = 1
        });

        dbContext.MenuItems.Add(new MenuItem
        {
            Id = menuItemId,
            RestaurantId = restaurantId,
            CategoryId = categoryId,
            Name = "Juane",
            Description = "Tradicional",
            Price = 12.5m,
            TrackStock = false,
            IsAvailable = true,
            IsActive = true
        });

        await dbContext.SaveChangesAsync();
        return (customerUserId, customerId, restaurantId, menuItemId, primaryZoneId, secondaryZoneId);
    }

    private sealed class TestCurrentUserService(Guid userId, string role) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "test@appurape.test";

        public string? Role { get; } = role;

        public bool IsAuthenticated => true;
    }
}
