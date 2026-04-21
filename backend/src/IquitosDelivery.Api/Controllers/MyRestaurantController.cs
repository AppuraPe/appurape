using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/my/restaurant")]
[Authorize(Roles = "Restaurant")]
public class MyRestaurantController : ControllerBase
{
    private readonly IRestaurantService _restaurantService;

    public MyRestaurantController(IRestaurantService restaurantService)
    {
        _restaurantService = restaurantService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(MyRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyRestaurantResponse>> GetMyRestaurant(CancellationToken cancellationToken)
    {
        var response = await _restaurantService.GetMyRestaurantAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut]
    [ProducesResponseType(typeof(MyRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyRestaurantResponse>> UpdateMyRestaurant([FromBody] UpdateMyRestaurantRequest request, CancellationToken cancellationToken)
    {
        var response = await _restaurantService.UpdateMyRestaurantAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("activation")]
    [ProducesResponseType(typeof(MyRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyRestaurantResponse>> UpdateActivation([FromBody] UpdateRestaurantActivationRequest request, CancellationToken cancellationToken)
    {
        var response = await _restaurantService.UpdateMyRestaurantActivationAsync(request, cancellationToken);
        return Ok(response);
    }
}
