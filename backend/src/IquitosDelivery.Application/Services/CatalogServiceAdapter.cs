using IquitosDelivery.Application.Interfaces;

namespace IquitosDelivery.Application.Services;

public class CatalogServiceAdapter : ICatalogService
{
    private readonly IMenuService _menuService;

    public CatalogServiceAdapter(IMenuService menuService)
    {
        _menuService = menuService;
    }

    public Task<CatalogResponse> GetPublicCatalogAsync(
        Guid businessId,
        CatalogFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        return _menuService.GetPublicMenuAsync(businessId, filters, cancellationToken);
    }

    public Task<PublicProductDetailResponse> GetPublicProductAsync(
        Guid businessId,
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return _menuService.GetPublicProductAsync(businessId, productId, cancellationToken);
    }

    public Task<IReadOnlyList<CatalogCategoryResponse>> GetMyCategoriesAsync(
        CatalogCategoryFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        return _menuService.GetMyCategoriesAsync(filters, cancellationToken);
    }

    public Task<CatalogCategoryResponse> CreateCategoryAsync(CreateCatalogCategoryRequest request, CancellationToken cancellationToken = default)
    {
        return _menuService.CreateCategoryAsync(request, cancellationToken);
    }

    public Task<CatalogCategoryResponse> UpdateCategoryAsync(Guid categoryId, UpdateCatalogCategoryRequest request, CancellationToken cancellationToken = default)
    {
        return _menuService.UpdateCategoryAsync(categoryId, request, cancellationToken);
    }

    public Task<IReadOnlyList<CatalogItemResponse>> GetMyItemsAsync(
        CatalogItemFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        return _menuService.GetMyItemsAsync(filters, cancellationToken);
    }

    public Task<CatalogItemResponse> CreateItemAsync(CreateCatalogItemRequest request, CancellationToken cancellationToken = default)
    {
        return _menuService.CreateItemAsync(request, cancellationToken);
    }

    public Task<CatalogItemResponse> UpdateItemAsync(Guid itemId, UpdateCatalogItemRequest request, CancellationToken cancellationToken = default)
    {
        return _menuService.UpdateItemAsync(itemId, request, cancellationToken);
    }

    public Task<CatalogItemResponse> UpdateItemAvailabilityAsync(Guid itemId, CatalogItemAvailabilityRequest request, CancellationToken cancellationToken = default)
    {
        return _menuService.UpdateItemAvailabilityAsync(itemId, request, cancellationToken);
    }
}
