using IquitosDelivery.Application.DTOs.Menu;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Api.Controllers.Requests.Menu;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/my/menu")]
[Authorize(Roles = "Restaurant")]
public class MyMenuController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public MyMenuController(
        IMenuService menuService,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService)
    {
        _menuService = menuService;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<MenuCategoryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MenuCategoryResponse>>> GetCategories(
        [FromQuery] MenuCategoryFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _menuService.GetMyCategoriesAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpPost("categories")]
    [ProducesResponseType(typeof(MenuCategoryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuCategoryResponse>> CreateCategory([FromBody] CreateMenuCategoryRequest request, CancellationToken cancellationToken)
    {
        var response = await _menuService.CreateCategoryAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPut("categories/{id:guid}")]
    [ProducesResponseType(typeof(MenuCategoryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuCategoryResponse>> UpdateCategory(Guid id, [FromBody] UpdateMenuCategoryRequest request, CancellationToken cancellationToken)
    {
        var response = await _menuService.UpdateCategoryAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<MenuItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MenuItemResponse>>> GetItems(
        [FromQuery] MenuItemFilterRequest filters,
        CancellationToken cancellationToken)
    {
        var response = await _menuService.GetMyItemsAsync(filters, cancellationToken);
        return Ok(response);
    }

    [HttpPost("items")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MenuItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuItemResponse>> CreateItem([FromForm] CreateMenuItemFormRequest request, CancellationToken cancellationToken)
    {
        var imageUrl = await UploadMenuImageAsync(request.ImageFile, $"restaurants/{GetRequiredUserId()}/menu-items/{Guid.NewGuid()}", cancellationToken);
        var appRequest = new CreateMenuItemRequest
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

        var response = await _menuService.CreateItemAsync(appRequest, cancellationToken);
        return Ok(response);
    }

    [HttpPut("items/{id:guid}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MenuItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuItemResponse>> UpdateItem(Guid id, [FromForm] UpdateMenuItemFormRequest request, CancellationToken cancellationToken)
    {
        var currentItem = (await _menuService.GetMyItemsAsync(new MenuItemFilterRequest(), cancellationToken))
            .FirstOrDefault(item => item.Id == id);
        var currentImageUrl = currentItem?.ImageUrl;
        var imageUrl = request.ImageUrl?.Trim();
        if (request.ImageFile is not null && request.ImageFile.Length > 0)
        {
            imageUrl = await UploadMenuImageAsync(request.ImageFile, $"restaurants/{GetRequiredUserId()}/menu-items/{id}", cancellationToken);
        }

        var appRequest = new UpdateMenuItemRequest
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

        var response = await _menuService.UpdateItemAsync(id, appRequest, cancellationToken);

        if (request.ImageFile is not null && request.ImageFile.Length > 0 && !string.IsNullOrWhiteSpace(currentImageUrl) && !string.Equals(currentImageUrl, response.ImageUrl, StringComparison.OrdinalIgnoreCase))
        {
            await _fileStorageService.DeleteByPublicUrlAsync(currentImageUrl, cancellationToken);
        }

        return Ok(response);
    }

    [HttpPatch("items/{id:guid}/availability")]
    [ProducesResponseType(typeof(MenuItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuItemResponse>> UpdateAvailability(Guid id, [FromBody] UpdateMenuItemAvailabilityRequest request, CancellationToken cancellationToken)
    {
        var response = await _menuService.UpdateItemAvailabilityAsync(id, request, cancellationToken);
        return Ok(response);
    }

    private Guid GetRequiredUserId()
    {
        return _currentUserService.UserId ?? throw new UnauthorizedException("Authentication is required.");
    }

    private async Task<string?> UploadMenuImageAsync(IFormFile? file, string objectPath, CancellationToken cancellationToken)
    {
        return await FileUploadHelper.UploadImageAsync(_fileStorageService, file, objectPath, cancellationToken);
    }
}
