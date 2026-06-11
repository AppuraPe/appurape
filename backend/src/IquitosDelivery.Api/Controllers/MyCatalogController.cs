using IquitosDelivery.Api.Controllers.Requests.Menu;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/my/catalog")]
[Authorize(Roles = "Restaurant")]
public class MyCatalogController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public MyCatalogController(
        ICatalogService catalogService,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService)
    {
        _catalogService = catalogService;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<CatalogCategoryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CatalogCategoryResponse>>> GetCategories(
        [FromQuery] CatalogCategoryFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _catalogService.GetMyCategoriesAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpPost("categories")]
    [ProducesResponseType(typeof(CatalogCategoryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogCategoryResponse>> CreateCategory([FromBody] CreateCatalogCategoryRequest request, CancellationToken cancellationToken)
    {
        var response = await _catalogService.CreateCategoryAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPut("categories/{id:guid}")]
    [ProducesResponseType(typeof(CatalogCategoryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogCategoryResponse>> UpdateCategory(Guid id, [FromBody] UpdateCatalogCategoryRequest request, CancellationToken cancellationToken)
    {
        var response = await _catalogService.UpdateCategoryAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<CatalogItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CatalogItemResponse>>> GetItems(
        [FromQuery] CatalogItemFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _catalogService.GetMyItemsAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpPost("items")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(CatalogItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> CreateItem([FromForm] CreateMenuItemFormRequest request, CancellationToken cancellationToken)
    {
        var imageUrl = await UploadCatalogImageAsync(request.ImageFile, $"businesses/{GetRequiredUserId()}/catalog-items/{Guid.NewGuid()}", cancellationToken);
        var appRequest = new CreateCatalogItemRequest
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            ImageUrl = imageUrl,
            Sku = request.Sku,
            UnitLabel = request.UnitLabel,
            TrackStock = request.TrackStock,
            StockQuantity = request.StockQuantity
        };

        var response = await _catalogService.CreateItemAsync(appRequest, cancellationToken);
        return Ok(response);
    }

    [HttpPut("items/{id:guid}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(CatalogItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> UpdateItem(Guid id, [FromForm] UpdateMenuItemFormRequest request, CancellationToken cancellationToken)
    {
        var currentItem = (await _catalogService.GetMyItemsAsync(new CatalogItemFilterRequest(), cancellationToken))
            .FirstOrDefault(item => item.Id == id);
        var currentImageUrl = currentItem?.ImageUrl;
        var imageUrl = request.ImageUrl?.Trim();
        if (request.ImageFile is not null && request.ImageFile.Length > 0)
        {
            imageUrl = await UploadCatalogImageAsync(request.ImageFile, $"businesses/{GetRequiredUserId()}/catalog-items/{id}", cancellationToken);
        }

        var appRequest = new UpdateCatalogItemRequest
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl,
            Sku = request.Sku,
            UnitLabel = request.UnitLabel,
            TrackStock = request.TrackStock,
            StockQuantity = request.StockQuantity,
            IsAvailable = request.IsAvailable,
            IsActive = request.IsActive
        };

        var response = await _catalogService.UpdateItemAsync(id, appRequest, cancellationToken);

        if (request.ImageFile is not null && request.ImageFile.Length > 0 && !string.IsNullOrWhiteSpace(currentImageUrl) && !string.Equals(currentImageUrl, response.ImageUrl, StringComparison.OrdinalIgnoreCase))
        {
            await _fileStorageService.DeleteByPublicUrlAsync(currentImageUrl, cancellationToken);
        }

        return Ok(response);
    }

    [HttpPatch("items/{id:guid}/availability")]
    [ProducesResponseType(typeof(CatalogItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogItemResponse>> UpdateAvailability(Guid id, [FromBody] CatalogItemAvailabilityRequest request, CancellationToken cancellationToken)
    {
        var response = await _catalogService.UpdateItemAvailabilityAsync(id, request, cancellationToken);
        return Ok(response);
    }

    private Guid GetRequiredUserId()
    {
        return _currentUserService.UserId ?? throw new UnauthorizedException("Authentication is required.");
    }

    private async Task<string?> UploadCatalogImageAsync(IFormFile? file, string objectPath, CancellationToken cancellationToken)
    {
        return await FileUploadHelper.UploadImageAsync(_fileStorageService, file, objectPath, cancellationToken);
    }
}
