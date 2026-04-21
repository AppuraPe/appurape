using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Interfaces;

public interface IRestaurantRegistrationService
{
    Task<VerificationCodeResponse> StartRestaurantRegistrationAsync(StartRestaurantRegistrationRequest request, CancellationToken cancellationToken = default);

    Task<VerificationStatusResponse> VerifyRestaurantCodeAsync(VerifyRestaurantRegistrationCodeRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> CompleteRestaurantRegistrationAsync(CompleteRestaurantRegistrationRequest request, CancellationToken cancellationToken = default);

    Task<VerificationCodeResponse> ResendRestaurantCodeAsync(ResendRestaurantRegistrationCodeRequest request, CancellationToken cancellationToken = default);
}
