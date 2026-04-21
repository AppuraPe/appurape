using FluentValidation;
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

    public async Task<PublicMenuResponse> GetPublicMenuAsync(Guid restaurantId, CancellationToken cancellationToken = default)
    {
        var restaurant = await _dbContext.Restaurants
            .Include(x => x.Categories)
                .ThenInclude(x => x.MenuItems)
            .FirstOrDefaultAsync(
                x => x.Id == restaurantId &&
                     x.ApprovalStatus == ApprovalStatus.Approved &&
                     x.IsActive,
                cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("Restaurant menu is not available.");
        }

        return new PublicMenuResponse
        {
            RestaurantId = restaurant.Id,
            RestaurantName = restaurant.Name,
            Categories = restaurant.Categories
                .Where(x => x.IsActive)
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.Name)
                .Select(x => new PublicMenuCategoryResponse
                {
                    Id = x.Id,
                    Name = x.Name,
                    SortOrder = x.SortOrder,
                    Items = x.MenuItems
                        .Where(i => i.IsActive && i.IsAvailable)
                        .OrderBy(i => i.Name)
                        .Select(i => new MenuItemResponse
                        {
                            Id = i.Id,
                            RestaurantId = i.RestaurantId,
                            CategoryId = i.CategoryId,
                            CategoryName = x.Name,
                            Name = i.Name,
                            Description = i.Description,
                            Price = i.Price,
                            ImageUrl = i.ImageUrl,
                            IsAvailable = i.IsAvailable,
                            IsActive = i.IsActive
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    public async Task<IReadOnlyList<MenuCategoryResponse>> GetMyCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        return await _dbContext.MenuCategories
            .Where(x => x.RestaurantId == restaurant.Id)
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

    public async Task<IReadOnlyList<MenuItemResponse>> GetMyItemsAsync(CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        return await _dbContext.MenuItems
            .Where(x => x.RestaurantId == restaurant.Id)
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
            IsAvailable = true,
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
        item.IsAvailable = request.IsAvailable;
        item.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapItemAsync(item.Id, cancellationToken);
    }

    public async Task<MenuItemResponse> UpdateItemAvailabilityAsync(Guid itemId, UpdateMenuItemAvailabilityRequest request, CancellationToken cancellationToken = default)
    {
        await _updateAvailabilityValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var item = await GetOwnedItemAsync(restaurant.Id, itemId, cancellationToken);

        item.IsAvailable = request.IsAvailable;
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
}
