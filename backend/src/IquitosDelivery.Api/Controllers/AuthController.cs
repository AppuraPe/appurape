using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Interfaces;
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

    public AuthController(
        IAuthService authService,
        ICustomerRegistrationService customerRegistrationService,
        IRestaurantRegistrationService restaurantRegistrationService,
        IDriverRegistrationService driverRegistrationService)
    {
        _authService = authService;
        _customerRegistrationService = customerRegistrationService;
        _restaurantRegistrationService = restaurantRegistrationService;
        _driverRegistrationService = driverRegistrationService;
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
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> StartRestaurantRegistration([FromBody] StartRestaurantRegistrationRequest request, CancellationToken cancellationToken)
    {
        var response = await _restaurantRegistrationService.StartRestaurantRegistrationAsync(request, cancellationToken);
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
    [ProducesResponseType(typeof(VerificationCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationCodeResponse>> StartDriverRegistration([FromBody] StartDriverRegistrationRequest request, CancellationToken cancellationToken)
    {
        var response = await _driverRegistrationService.StartDriverRegistrationAsync(request, cancellationToken);
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

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrentUserResponse>> Me(CancellationToken cancellationToken)
    {
        var response = await _authService.GetCurrentUserAsync(cancellationToken);
        return Ok(response);
    }
}
