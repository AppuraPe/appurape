using IquitosDelivery.Application.DTOs.Menu;

namespace IquitosDelivery.Application.Interfaces;

public interface IMenuService
{
    Task<PublicMenuResponse> GetPublicMenuAsync(
        Guid restaurantId,
        PublicMenuFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MenuCategoryResponse>> GetMyCategoriesAsync(
        MenuCategoryFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<MenuCategoryResponse> CreateCategoryAsync(CreateMenuCategoryRequest request, CancellationToken cancellationToken = default);

    Task<MenuCategoryResponse> UpdateCategoryAsync(Guid categoryId, UpdateMenuCategoryRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MenuItemResponse>> GetMyItemsAsync(
        MenuItemFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<MenuItemResponse> CreateItemAsync(CreateMenuItemRequest request, CancellationToken cancellationToken = default);

    Task<MenuItemResponse> UpdateItemAsync(Guid itemId, UpdateMenuItemRequest request, CancellationToken cancellationToken = default);

    Task<MenuItemResponse> UpdateItemAvailabilityAsync(Guid itemId, UpdateMenuItemAvailabilityRequest request, CancellationToken cancellationToken = default);
}
