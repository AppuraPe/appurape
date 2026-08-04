using IquitosDelivery.Application.DTOs.Menu;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Application.Validators;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Tests;

public class MenuAndSearchServiceTests
{
    [Fact]
    public async Task PublicMenu_ShowsOnlyActiveAvailableProductsWithStock()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedMenuFixtureAsync(dbContext);
        var service = CreateMenuService(dbContext);

        var menu = await service.GetPublicMenuAsync(fixture.RestaurantId, new PublicMenuFilterRequest());
        var itemNames = menu.Categories.SelectMany(x => x.Items).Select(x => x.Name).ToList();

        Assert.Contains("Visible tracked", itemNames);
        Assert.Contains("Visible unlimited", itemNames);
        Assert.DoesNotContain("Inactive product", itemNames);
        Assert.DoesNotContain("Out of stock", itemNames);
    }

    [Fact]
    public async Task PublicProduct_InactiveOrUnavailableBusiness_ReturnsNotFound()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedMenuFixtureAsync(dbContext);
        var service = CreateMenuService(dbContext);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetPublicProductAsync(fixture.InactiveRestaurantId, fixture.InactiveBusinessProductId));
    }

    [Fact]
    public async Task SearchPublic_FindsBusinessAndProductButSkipsInactiveBusiness()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedMenuFixtureAsync(dbContext);
        var service = new SearchService(dbContext);

        var byBusiness = await service.SearchPublicAsync("Resto Visible");
        var byProduct = await service.SearchPublicAsync("tracked");
        var inactive = await service.SearchPublicAsync("Resto Inactivo");

        Assert.Contains(byBusiness.Restaurants, x => x.RestaurantId == fixture.RestaurantId);
        Assert.Contains(byProduct.Foods, x => x.MenuItemId == fixture.VisibleTrackedProductId);
        Assert.DoesNotContain(inactive.Restaurants, x => x.RestaurantId == fixture.InactiveRestaurantId);
    }

    [Fact]
    public async Task Business_CreatesProductAndUpdatesAvailability()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedMenuFixtureAsync(dbContext);
        var service = CreateMenuService(dbContext, fixture.RestaurantOwnerUserId);

        var created = await service.CreateItemAsync(new CreateMenuItemRequest
        {
            CategoryId = fixture.CategoryId,
            Name = "Nuevo plato",
            Description = "Nuevo plato de prueba",
            Price = 12m,
            TrackStock = true,
            StockQuantity = 3
        });

        var unavailable = await service.UpdateItemAvailabilityAsync(
            created.Id,
            new UpdateMenuItemAvailabilityRequest { IsAvailable = false });

        Assert.Equal("Nuevo plato", created.Name);
        Assert.Equal(3, created.StockQuantity);
        Assert.False(unavailable.IsAvailable);
    }

    [Fact]
    public async Task Business_CannotModifyForeignProduct()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedMenuFixtureAsync(dbContext);
        var service = CreateMenuService(dbContext, fixture.ForeignRestaurantOwnerUserId);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateItemAvailabilityAsync(
                fixture.VisibleTrackedProductId,
                new UpdateMenuItemAvailabilityRequest { IsAvailable = false }));
    }

    [Fact]
    public async Task Business_InvalidPriceOrNegativeStock_IsRejected()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedMenuFixtureAsync(dbContext);
        var service = CreateMenuService(dbContext, fixture.RestaurantOwnerUserId);

        await Assert.ThrowsAsync<FluentValidation.ValidationException>(() =>
            service.CreateItemAsync(new CreateMenuItemRequest
            {
                CategoryId = fixture.CategoryId,
                Name = "Precio malo",
                Description = "Debe fallar",
                Price = 0m,
                TrackStock = true,
                StockQuantity = 1
            }));

        await Assert.ThrowsAsync<FluentValidation.ValidationException>(() =>
            service.CreateItemAsync(new CreateMenuItemRequest
            {
                CategoryId = fixture.CategoryId,
                Name = "Stock malo",
                Description = "Debe fallar",
                Price = 10m,
                TrackStock = true,
                StockQuantity = -1
            }));
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static MenuService CreateMenuService(AppDbContext dbContext, Guid? userId = null)
    {
        return new MenuService(
            dbContext,
            new TestCurrentUserService(userId),
            new CreateMenuCategoryRequestValidator(),
            new UpdateMenuCategoryRequestValidator(),
            new CreateMenuItemRequestValidator(),
            new UpdateMenuItemRequestValidator(),
            new UpdateMenuItemAvailabilityRequestValidator());
    }

    private static async Task<MenuFixture> SeedMenuFixtureAsync(AppDbContext dbContext)
    {
        var zoneId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var foreignOwnerId = Guid.NewGuid();
        var inactiveOwnerId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var foreignRestaurantId = Guid.NewGuid();
        var inactiveRestaurantId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var foreignCategoryId = Guid.NewGuid();
        var inactiveBusinessCategoryId = Guid.NewGuid();
        var visibleTrackedId = Guid.NewGuid();
        var inactiveBusinessProductId = Guid.NewGuid();

        dbContext.Zones.Add(new Zone
        {
            Id = zoneId,
            Name = "Centro",
            DeliveryFee = 5m,
            IsActive = true
        });

        dbContext.Users.AddRange(
            CreateUser(ownerId, "owner-menu@appurape.test"),
            CreateUser(foreignOwnerId, "foreign-menu@appurape.test"),
            CreateUser(inactiveOwnerId, "inactive-menu@appurape.test"));

        dbContext.Restaurants.AddRange(
            CreateRestaurant(restaurantId, ownerId, zoneId, "Resto Visible", ApprovalStatus.Approved, true),
            CreateRestaurant(foreignRestaurantId, foreignOwnerId, zoneId, "Resto Ajeno", ApprovalStatus.Approved, true),
            CreateRestaurant(inactiveRestaurantId, inactiveOwnerId, zoneId, "Resto Inactivo", ApprovalStatus.Pending, false));

        dbContext.MenuCategories.AddRange(
            CreateCategory(categoryId, restaurantId),
            CreateCategory(foreignCategoryId, foreignRestaurantId),
            CreateCategory(inactiveBusinessCategoryId, inactiveRestaurantId));

        dbContext.MenuItems.AddRange(
            CreateItem(visibleTrackedId, restaurantId, categoryId, "Visible tracked", true, 4, true, true),
            CreateItem(Guid.NewGuid(), restaurantId, categoryId, "Visible unlimited", false, null, true, true),
            CreateItem(Guid.NewGuid(), restaurantId, categoryId, "Inactive product", false, null, true, false),
            CreateItem(Guid.NewGuid(), restaurantId, categoryId, "Out of stock", true, 0, true, true),
            CreateItem(Guid.NewGuid(), foreignRestaurantId, foreignCategoryId, "Foreign product", true, 2, true, true),
            CreateItem(inactiveBusinessProductId, inactiveRestaurantId, inactiveBusinessCategoryId, "Hidden inactive business", false, null, true, true));

        await dbContext.SaveChangesAsync();

        return new MenuFixture(
            RestaurantOwnerUserId: ownerId,
            ForeignRestaurantOwnerUserId: foreignOwnerId,
            RestaurantId: restaurantId,
            InactiveRestaurantId: inactiveRestaurantId,
            CategoryId: categoryId,
            VisibleTrackedProductId: visibleTrackedId,
            InactiveBusinessProductId: inactiveBusinessProductId);
    }

    private static User CreateUser(Guid id, string email)
    {
        return new User
        {
            Id = id,
            FirstName = "Owner",
            LastName = "Menu",
            Phone = "900000100",
            Email = email,
            PasswordHash = "hash",
            Role = UserRole.Restaurant,
            Status = UserStatus.Active
        };
    }

    private static Restaurant CreateRestaurant(
        Guid id,
        Guid ownerId,
        Guid zoneId,
        string name,
        ApprovalStatus approvalStatus,
        bool isActive)
    {
        return new Restaurant
        {
            Id = id,
            OwnerUserId = ownerId,
            Name = name,
            Description = $"{name} description",
            Address = "Av. Menu",
            Reference = "Ref",
            ZoneId = zoneId,
            ApprovalStatus = approvalStatus,
            OpenTime = TimeSpan.FromHours(8),
            CloseTime = TimeSpan.FromHours(22),
            IsActive = isActive
        };
    }

    private static MenuCategory CreateCategory(Guid id, Guid restaurantId)
    {
        return new MenuCategory
        {
            Id = id,
            RestaurantId = restaurantId,
            Name = "Platos",
            IsActive = true,
            SortOrder = 1
        };
    }

    private static MenuItem CreateItem(
        Guid id,
        Guid restaurantId,
        Guid categoryId,
        string name,
        bool trackStock,
        int? stockQuantity,
        bool isAvailable,
        bool isActive)
    {
        return new MenuItem
        {
            Id = id,
            RestaurantId = restaurantId,
            CategoryId = categoryId,
            Name = name,
            Description = $"{name} description",
            Price = 10m,
            TrackStock = trackStock,
            StockQuantity = stockQuantity,
            IsAvailable = isAvailable,
            IsActive = isActive
        };
    }

    private sealed record MenuFixture(
        Guid RestaurantOwnerUserId,
        Guid ForeignRestaurantOwnerUserId,
        Guid RestaurantId,
        Guid InactiveRestaurantId,
        Guid CategoryId,
        Guid VisibleTrackedProductId,
        Guid InactiveBusinessProductId);

    private sealed class TestCurrentUserService(Guid? userId) : ICurrentUserService
    {
        public Guid? UserId { get; } = userId;

        public string? Email => "menu@appurape.test";

        public string? Role => UserRole.Restaurant.ToString();

        public bool IsAuthenticated => UserId.HasValue;
    }
}
