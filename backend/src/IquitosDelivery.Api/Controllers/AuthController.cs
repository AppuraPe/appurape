using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Api.Controllers.Requests.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICustomerRegistrationService _customerRegistrationService;
    private readonly IRestaurantRegistrationService _restaurantRegistrationService;
    private readonly IDriverRegistrationService _driverRegistrationService;
    private readonly IFileStorageService _fileStorageService;

    public AuthController(
        IAuthService authService,
        ICustomerRegistrationService customerRegistrationService,
        IRestaurantRegistrationService restaurantRegistrationService,
        IDriverRegistrationService driverRegistrationService,
        IFileStorageService fileStorageService)
    {
        _authService = authService;
        _customerRegistrationService = customerRegistrationService;
        _restaurantRegistrationService = restaurantRegistrationService;
        _driverRegistrationService = driverRegistrationService;
        _fileStorageService = fileStorageService;
    }

    [HttpPost("register/customer/start")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> StartCustomerRegistration([FromBody] StartCustomerRegistrationRequest request, CancellationToken cancellationToken)
    {
        var response = await _customerRegistrationService.StartRegistrationAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/customer/verify-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationStatusResponse>> VerifyCustomerRegistrationCode([FromBody] VerifyCustomerRegistrationCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _customerRegistrationService.VerifyCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/customer/complete")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> CompleteCustomerRegistration([FromBody] CompleteCustomerRegistrationRequest request, CancellationToken cancellationToken)
    {
        var response = await _customerRegistrationService.CompleteRegistrationAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/customer/resend-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> ResendCustomerRegistrationCode([FromBody] ResendCustomerRegistrationCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _customerRegistrationService.ResendCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/restaurant/start")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> StartRestaurantRegistration([FromForm] StartRestaurantRegistrationFormRequest request, CancellationToken cancellationToken)
    {
        var logoUrl = await FileUploadHelper.UploadImageAsync(
            _fileStorageService,
            request.LogoFile,
            $"registrations/restaurants/{Guid.NewGuid()}/logo",
            cancellationToken);

        var appRequest = new StartRestaurantRegistrationRequest
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Email = request.Email,
            RestaurantName = request.RestaurantName,
            Description = request.Description,
            Address = request.Address,
            Reference = request.Reference,
            ZoneId = request.ZoneId,
            BusinessTypeId = request.BusinessTypeId,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            LogoUrl = logoUrl
        };

        var response = await _restaurantRegistrationService.StartRestaurantRegistrationAsync(appRequest, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/restaurant/verify-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationStatusResponse>> VerifyRestaurantRegistrationCode([FromBody] VerifyRestaurantRegistrationCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _restaurantRegistrationService.VerifyRestaurantCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/restaurant/complete")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> CompleteRestaurantRegistration([FromBody] CompleteRestaurantRegistrationRequest request, CancellationToken cancellationToken)
    {
        var response = await _restaurantRegistrationService.CompleteRestaurantRegistrationAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/restaurant/resend-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> ResendRestaurantRegistrationCode([FromBody] ResendRestaurantRegistrationCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _restaurantRegistrationService.ResendRestaurantCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/driver/start")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> StartDriverRegistration([FromForm] StartDriverRegistrationFormRequest request, CancellationToken cancellationToken)
    {
        var identityDocumentUrl = await FileUploadHelper.UploadImageAsync(
            _fileStorageService,
            request.IdentityDocumentFile,
            $"registrations/drivers/{Guid.NewGuid()}/identity-document",
            cancellationToken);

        var vehiclePhotoUrl = await FileUploadHelper.UploadImageAsync(
            _fileStorageService,
            request.VehiclePhotoFile,
            $"registrations/drivers/{Guid.NewGuid()}/vehicle-photo",
            cancellationToken);

        var appRequest = new StartDriverRegistrationRequest
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Email = request.Email,
            VehicleType = request.VehicleType,
            Plate = request.Plate,
            ZoneId = request.ZoneId,
            IdentityDocumentUrl = identityDocumentUrl,
            VehiclePhotoUrl = vehiclePhotoUrl
        };

        var response = await _driverRegistrationService.StartDriverRegistrationAsync(appRequest, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/driver/verify-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationStatusResponse>> VerifyDriverRegistrationCode([FromBody] VerifyDriverRegistrationCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _driverRegistrationService.VerifyDriverCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/driver/complete")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> CompleteDriverRegistration([FromBody] CompleteDriverRegistrationRequest request, CancellationToken cancellationToken)
    {
        var response = await _driverRegistrationService.CompleteDriverRegistrationAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/driver/resend-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> ResendDriverRegistrationCode([FromBody] ResendDriverRegistrationCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _driverRegistrationService.ResendDriverCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/restaurant")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> RegisterRestaurant([FromBody] RegisterRestaurantRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterRestaurantAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("register/driver")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> RegisterDriver([FromBody] RegisterDriverRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterDriverAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> LoginWithGoogle([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginWithGoogleAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("password/forgot")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> StartPasswordReset([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.StartPasswordResetAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("password/resend-code")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> ResendPasswordResetCode([FromBody] ResendPasswordResetCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.ResendPasswordResetCodeAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("password/reset")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerificationStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationStatusResponse>> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrentUserResponse>> Me(CancellationToken cancellationToken)
    {
        var response = await _authService.GetCurrentUserAsync(cancellationToken);
        return Ok(response);
    }
}
