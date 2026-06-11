using IquitosDelivery.Api.Controllers.Requests.Restaurants;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/my/business")]
[Authorize(Roles = "Restaurant")]
public class MyBusinessController : ControllerBase
{
    private readonly IBusinessService _businessService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public MyBusinessController(
        IBusinessService businessService,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService)
    {
        _businessService = businessService;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(MyBusinessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyBusinessResponse>> GetMyBusiness(CancellationToken cancellationToken)
    {
        var response = await _businessService.GetMyBusinessAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MyBusinessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyBusinessResponse>> UpdateMyBusiness([FromForm] UpdateMyRestaurantFormRequest request, CancellationToken cancellationToken)
    {
        var currentBusiness = await _businessService.GetMyBusinessAsync(cancellationToken);
        var currentLogoUrl = currentBusiness.LogoUrl;
        var logoUrl = request.LogoUrl?.Trim();
        if (request.LogoFile is not null && request.LogoFile.Length > 0)
        {
            var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Authentication is required.");
            logoUrl = await FileUploadHelper.UploadImageAsync(
                _fileStorageService,
                request.LogoFile,
                $"businesses/{userId}/logo",
                cancellationToken);
        }

        var appRequest = new UpdateMyBusinessRequest
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

        var response = await _businessService.UpdateMyBusinessAsync(appRequest, cancellationToken);

        if (request.LogoFile is not null && request.LogoFile.Length > 0 && !string.IsNullOrWhiteSpace(currentLogoUrl) && !string.Equals(currentLogoUrl, response.LogoUrl, StringComparison.OrdinalIgnoreCase))
        {
            await _fileStorageService.DeleteByPublicUrlAsync(currentLogoUrl, cancellationToken);
        }

        return Ok(response);
    }

    [HttpPatch("activation")]
    [ProducesResponseType(typeof(MyBusinessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MyBusinessResponse>> UpdateActivation([FromBody] UpdateBusinessActivationRequest request, CancellationToken cancellationToken)
    {
        var response = await _businessService.UpdateMyBusinessActivationAsync(request, cancellationToken);
        return Ok(response);
    }
}
