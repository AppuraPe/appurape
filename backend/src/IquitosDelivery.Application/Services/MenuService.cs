using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Menu;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class MenuService : IMenuService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<CreateMenuCategoryRequest> _createCategoryValidator;
    private readonly IValidator<UpdateMenuCategoryRequest> _updateCategoryValidator;
    private readonly IValidator<CreateMenuItemRequest> _createItemValidator;
    private readonly IValidator<UpdateMenuItemRequest> _updateItemValidator;
    private readonly IValidator<UpdateMenuItemAvailabilityRequest> _updateAvailabilityValidator;

    public MenuService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IValidator<CreateMenuCategoryRequest> createCategoryValidator,
        IValidator<UpdateMenuCategoryRequest> updateCategoryValidator,
        IValidator<CreateMenuItemRequest> createItemValidator,
        IValidator<UpdateMenuItemRequest> updateItemValidator,
        IValidator<UpdateMenuItemAvailabilityRequest> updateAvailabilityValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _createCategoryValidator = createCategoryValidator;
        _updateCategoryValidator = updateCategoryValidator;
        _createItemValidator = createItemValidator;
        _updateItemValidator = updateItemValidator;
        _updateAvailabilityValidator = updateAvailabilityValidator;
    }

    public async Task<PublicMenuResponse> GetPublicMenuAsync(
        Guid restaurantId,
        PublicMenuFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var restaurant = await _dbContext.Restaurants
            .Where(x =>
                x.Id == restaurantId &&
                x.ApprovalStatus == ApprovalStatus.Approved &&
                x.IsActive)
            .Select(x => new PublicMenuResponse
            {
                RestaurantId = x.Id,
                RestaurantName = x.Name,
                Categories = x.Categories
                    .Where(c =>
                        c.IsActive &&
                        (searchTerm == null ||
                         c.Name.ToLower().Contains(searchTerm) ||
                         c.MenuItems.Any(i =>
                             i.IsActive &&
                             i.IsAvailable &&
                             (!i.TrackStock || !i.StockQuantity.HasValue || i.StockQuantity.Value > 0) &&
                             (i.Name.ToLower().Contains(searchTerm) ||
                              i.Description.ToLower().Contains(searchTerm)))))
                    .OrderBy(c => c.SortOrder)
                    .ThenBy(c => c.Name)
                    .Select(c => new PublicMenuCategoryResponse
                    {
                        Id = c.Id,
                        Name = c.Name,
                        SortOrder = c.SortOrder,
                        Items = c.MenuItems
                            .Where(i =>
                                i.IsActive &&
                                i.IsAvailable &&
                                (!i.TrackStock || !i.StockQuantity.HasValue || i.StockQuantity.Value > 0) &&
                                (searchTerm == null ||
                                 c.Name.ToLower().Contains(searchTerm) ||
                                 i.Name.ToLower().Contains(searchTerm) ||
                                 i.Description.ToLower().Contains(searchTerm)))
                            .OrderBy(i => i.Name)
                            .Select(i => new MenuItemResponse
                            {
                                Id = i.Id,
                                RestaurantId = i.RestaurantId,
                                CategoryId = i.CategoryId,
                                CategoryName = c.Name,
                                Name = i.Name,
                                Description = i.Description,
                                Price = i.Price,
                                ImageUrl = i.ImageUrl,
                                Sku = i.Sku,
                                UnitLabel = i.UnitLabel,
                                TrackStock = i.TrackStock,
                                StockQuantity = i.StockQuantity,
                                HasStock = !i.TrackStock || !i.StockQuantity.HasValue || i.StockQuantity.Value > 0,
                                IsAvailable = i.IsAvailable && (!i.TrackStock || !i.StockQuantity.HasValue || i.StockQuantity.Value > 0),
                                IsActive = i.IsActive
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("Restaurant menu is not available.");
        }

        return restaurant;
    }

    public async Task<IReadOnlyList<MenuCategoryResponse>> GetMyCategoriesAsync(
        MenuCategoryFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var query = _dbContext.MenuCategories
            .Where(x => x.RestaurantId == restaurant.Id);

        if (filters.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == filters.IsActive.Value);
        }

        if (searchTerm is not null)
        {
            query = query.Where(x => x.Name.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new MenuCategoryResponse
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId,
                Name = x.Name,
                IsActive = x.IsActive,
                SortOrder = x.SortOrder
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<MenuCategoryResponse> CreateCategoryAsync(CreateMenuCategoryRequest request, CancellationToken cancellationToken = default)
    {
        await _createCategoryValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var category = new MenuCategory
        {
            Id = Guid.NewGuid(),
            RestaurantId = restaurant.Id,
            Name = request.Name.Trim(),
            IsActive = true,
            SortOrder = request.SortOrder
        };

        _dbContext.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapCategory(category);
    }

    public async Task<MenuCategoryResponse> UpdateCategoryAsync(Guid categoryId, UpdateMenuCategoryRequest request, CancellationToken cancellationToken = default)
    {
        await _updateCategoryValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var category = await _dbContext.MenuCategories
            .FirstOrDefaultAsync(x => x.Id == categoryId && x.RestaurantId == restaurant.Id, cancellationToken);

        if (category is null)
        {
            throw new NotFoundException("Category was not found.");
        }

        category.Name = request.Name.Trim();
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapCategory(category);
    }

    public async Task<IReadOnlyList<MenuItemResponse>> GetMyItemsAsync(
        MenuItemFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var query = _dbContext.MenuItems
            .Where(x => x.RestaurantId == restaurant.Id);

        if (filters.CategoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == filters.CategoryId.Value);
        }

        if (filters.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == filters.IsActive.Value);
        }

        if (filters.IsAvailable.HasValue)
        {
            query = query.Where(x => x.IsAvailable == filters.IsAvailable.Value);
        }

        if (searchTerm is not null)
        {
            query = query.Where(x =>
                x.Name.ToLower().Contains(searchTerm) ||
                x.Description.ToLower().Contains(searchTerm) ||
                x.Category.Name.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderBy(x => x.Name)
            .Select(x => new MenuItemResponse
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Name = x.Name,
                Description = x.Description,
                Price = x.Price,
                ImageUrl = x.ImageUrl,
                Sku = x.Sku,
                UnitLabel = x.UnitLabel,
                TrackStock = x.TrackStock,
                StockQuantity = x.StockQuantity,
                HasStock = !x.TrackStock || !x.StockQuantity.HasValue || x.StockQuantity.Value > 0,
                IsAvailable = x.IsAvailable,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<MenuItemResponse> CreateItemAsync(CreateMenuItemRequest request, CancellationToken cancellationToken = default)
    {
        await _createItemValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var category = await GetOwnedCategoryAsync(restaurant.Id, request.CategoryId, cancellationToken);

        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            RestaurantId = restaurant.Id,
            CategoryId = category.Id,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Price = request.Price,
            ImageUrl = NormalizeImageUrl(request.ImageUrl),
            Sku = NormalizeOptionalValue(request.Sku),
            UnitLabel = NormalizeOptionalValue(request.UnitLabel),
            TrackStock = request.TrackStock,
            StockQuantity = NormalizeStockQuantity(request.TrackStock, request.StockQuantity),
            IsAvailable = !request.TrackStock || !request.StockQuantity.HasValue || request.StockQuantity.Value > 0,
            IsActive = true
        };

        _dbContext.Add(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapItemAsync(item.Id, cancellationToken);
    }

    public async Task<MenuItemResponse> UpdateItemAsync(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken = default)
    {
        await _updateItemValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var item = await GetOwnedItemAsync(restaurant.Id, itemId, cancellationToken);
        var category = await GetOwnedCategoryAsync(restaurant.Id, request.CategoryId, cancellationToken);

        item.CategoryId = category.Id;
        item.Name = request.Name.Trim();
        item.Description = request.Description.Trim();
        item.Price = request.Price;
        item.ImageUrl = NormalizeImageUrl(request.ImageUrl);
        item.Sku = NormalizeOptionalValue(request.Sku);
        item.UnitLabel = NormalizeOptionalValue(request.UnitLabel);
        item.TrackStock = request.TrackStock;
        item.StockQuantity = NormalizeStockQuantity(request.TrackStock, request.StockQuantity);
        item.IsAvailable = request.IsAvailable && HasStock(item.TrackStock, item.StockQuantity);
        item.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapItemAsync(item.Id, cancellationToken);
    }

    public async Task<MenuItemResponse> UpdateItemAvailabilityAsync(Guid itemId, UpdateMenuItemAvailabilityRequest request, CancellationToken cancellationToken = default)
    {
        await _updateAvailabilityValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var item = await GetOwnedItemAsync(restaurant.Id, itemId, cancellationToken);

        item.IsAvailable = request.IsAvailable && HasStock(item.TrackStock, item.StockQuantity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapItemAsync(item.Id, cancellationToken);
    }

    private async Task<Restaurant> GetCurrentRestaurantAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var restaurant = await _dbContext.Restaurants
            .FirstOrDefaultAsync(x => x.OwnerUserId == _currentUserService.UserId.Value, cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("No restaurant is associated with the authenticated user.");
        }

        return restaurant;
    }

    private async Task<MenuCategory> GetOwnedCategoryAsync(Guid restaurantId, Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await _dbContext.MenuCategories
            .FirstOrDefaultAsync(x => x.Id == categoryId, cancellationToken);

        if (category is null)
        {
            throw new NotFoundException("Category was not found.");
        }

        if (category.RestaurantId != restaurantId)
        {
            throw new ForbiddenException("You are not allowed to modify categories from another restaurant.");
        }

        return category;
    }

    private async Task<MenuItem> GetOwnedItemAsync(Guid restaurantId, Guid itemId, CancellationToken cancellationToken)
    {
        var item = await _dbContext.MenuItems
            .FirstOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (item is null)
        {
            throw new NotFoundException("Product was not found.");
        }

        if (item.RestaurantId != restaurantId)
        {
            throw new ForbiddenException("You are not allowed to modify products from another restaurant.");
        }

        return item;
    }

    private async Task<MenuItemResponse> MapItemAsync(Guid itemId, CancellationToken cancellationToken)
    {
        return await _dbContext.MenuItems
            .Where(x => x.Id == itemId)
            .Select(x => new MenuItemResponse
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Name = x.Name,
                Description = x.Description,
                Price = x.Price,
                ImageUrl = x.ImageUrl,
                Sku = x.Sku,
                UnitLabel = x.UnitLabel,
                TrackStock = x.TrackStock,
                StockQuantity = x.StockQuantity,
                HasStock = !x.TrackStock || !x.StockQuantity.HasValue || x.StockQuantity.Value > 0,
                IsAvailable = x.IsAvailable,
                IsActive = x.IsActive
            })
            .FirstAsync(cancellationToken);
    }

    private static MenuCategoryResponse MapCategory(MenuCategory category)
    {
        return new MenuCategoryResponse
        {
            Id = category.Id,
            RestaurantId = category.RestaurantId,
            Name = category.Name,
            IsActive = category.IsActive,
            SortOrder = category.SortOrder
        };
    }

    private static string? NormalizeImageUrl(string? imageUrl)
    {
        return string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static int? NormalizeStockQuantity(bool trackStock, int? stockQuantity)
    {
        return trackStock ? stockQuantity ?? 0 : null;
    }

    private static bool HasStock(bool trackStock, int? stockQuantity)
    {
        return !trackStock || !stockQuantity.HasValue || stockQuantity.Value > 0;
    }
}
