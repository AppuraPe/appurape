using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterRestaurantAsync(RegisterRestaurantRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> RegisterDriverAsync(RegisterDriverRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default);

    Task<VerificationCodeResponse> StartPasswordResetAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);

    Task<VerificationCodeResponse> ResendPasswordResetCodeAsync(ResendPasswordResetCodeRequest request, CancellationToken cancellationToken = default);

    Task<VerificationStatusResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);

    Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}
