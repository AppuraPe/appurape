using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Api.Controllers.Requests.Restaurants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/my/restaurant")]
[Authorize(Roles = "Restaurant")]
public class MyRestaurantController : ControllerBase
{
    private readonly IRestaurantService _restaurantService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public MyRestaurantController(
        IRestaurantService restaurantService,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService)
    {
        _restaurantService = restaurantService;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(MyRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyRestaurantResponse>> GetMyRestaurant(CancellationToken cancellationToken)
    {
        var response = await _restaurantService.GetMyRestaurantAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MyRestaurantResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyRestaurantResponse>> UpdateMyRestaurant([FromForm] UpdateMyRestaurantFormRequest request, CancellationToken cancellationToken)
    {
        var currentRestaurant = await _restaurantService.GetMyRestaurantAsync(cancellationToken);
        var currentLogoUrl = currentRestaurant.LogoUrl;
        var logoUrl = request.LogoUrl?.Trim();
        if (request.LogoFile is not null && request.LogoFile.Length > 0)
        {
            var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Authentication is required.");
            logoUrl = await FileUploadHelper.UploadImageAsync(
                _fileStorageService,
                request.LogoFile,
                $"restaurants/{userId}/logo",
                cancellationToken);
        }

        var appRequest = new UpdateMyRestaurantRequest
        {
            Name = request.Name,
            Description = request.Description,
            Address = request.Address,
            Reference = request.Reference,
            ZoneId = request.ZoneId,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            LogoUrl = string.IsNullOrWhiteSpace(logoUrl) ? null : logoUrl
        };

        var response = await _restaurantService.UpdateMyRestaurantAsync(appRequest, cancellationToken);

        if (request.LogoFile is not null && request.LogoFile.Length > 0 && !string.IsNullOrWhiteSpace(currentLogoUrl) && !string.Equals(currentLogoUrl, response.LogoUrl, StringComparison.OrdinalIgnoreCase))
        {
            await _fileStorageService.DeleteByPublicUrlAsync(currentLogoUrl, cancellationToken);
        }

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
