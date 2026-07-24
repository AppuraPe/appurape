namespace IquitosDelivery.Application.Interfaces;

public interface ICatalogService
{
    Task<CatalogResponse> GetPublicCatalogAsync(
        Guid businessId,
        CatalogFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<PublicProductDetailResponse> GetPublicProductAsync(
        Guid businessId,
        Guid productId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CatalogCategoryResponse>> GetMyCategoriesAsync(
        CatalogCategoryFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<CatalogCategoryResponse> CreateCategoryAsync(CreateCatalogCategoryRequest request, CancellationToken cancellationToken = default);

    Task<CatalogCategoryResponse> UpdateCategoryAsync(Guid categoryId, UpdateCatalogCategoryRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CatalogItemResponse>> GetMyItemsAsync(
        CatalogItemFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<CatalogItemResponse> CreateItemAsync(CreateCatalogItemRequest request, CancellationToken cancellationToken = default);

    Task<CatalogItemResponse> UpdateItemAsync(Guid itemId, UpdateCatalogItemRequest request, CancellationToken cancellationToken = default);

    Task<CatalogItemResponse> UpdateItemAvailabilityAsync(Guid itemId, CatalogItemAvailabilityRequest request, CancellationToken cancellationToken = default);
}
