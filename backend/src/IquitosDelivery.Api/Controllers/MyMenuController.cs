using IquitosDelivery.Application.DTOs.Menu;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/my/menu")]
[Authorize(Roles = "Restaurant")]
public class MyMenuController : ControllerBase
{
    private readonly IMenuService _menuService;

    public MyMenuController(IMenuService menuService)
    {
        _menuService = menuService;
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
    [ProducesResponseType(typeof(MenuItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuItemResponse>> CreateItem([FromBody] CreateMenuItemRequest request, CancellationToken cancellationToken)
    {
        var response = await _menuService.CreateItemAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPut("items/{id:guid}")]
    [ProducesResponseType(typeof(MenuItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuItemResponse>> UpdateItem(Guid id, [FromBody] UpdateMenuItemRequest request, CancellationToken cancellationToken)
    {
        var response = await _menuService.UpdateItemAsync(id, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("items/{id:guid}/availability")]
    [ProducesResponseType(typeof(MenuItemResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MenuItemResponse>> UpdateAvailability(Guid id, [FromBody] UpdateMenuItemAvailabilityRequest request, CancellationToken cancellationToken)
    {
        var response = await _menuService.UpdateItemAvailabilityAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
