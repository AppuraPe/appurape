using IquitosDelivery.Application.DTOs.Menu;
using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/restaurants")]
public class RestaurantsController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IRestaurantService _restaurantService;

    public RestaurantsController(IRestaurantService restaurantService, IMenuService menuService)
    {
        _restaurantService = restaurantService;
        _menuService = menuService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RestaurantListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RestaurantListItemResponse>>> GetRestaurants(CancellationToken cancellationToken)
    {
        var response = await _restaurantService.GetPublicRestaurantsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RestaurantDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RestaurantDetailResponse>> GetRestaurant(Guid id, CancellationToken cancellationToken)
    {
        var response = await _restaurantService.GetPublicRestaurantDetailAsync(id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}/menu")]
    [ProducesResponseType(typeof(PublicMenuResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PublicMenuResponse>> GetPublicMenu(Guid id, CancellationToken cancellationToken)
    {
        var response = await _menuService.GetPublicMenuAsync(id, cancellationToken);
        return Ok(response);
    }
}
