using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Interfaces;

public interface IDriverRegistrationService
{
    Task<VerificationCodeResponse> StartDriverRegistrationAsync(StartDriverRegistrationRequest request, CancellationToken cancellationToken = default);

    Task<VerificationStatusResponse> VerifyDriverCodeAsync(VerifyDriverRegistrationCodeRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> CompleteDriverRegistrationAsync(CompleteDriverRegistrationRequest request, CancellationToken cancellationToken = default);

    Task<VerificationCodeResponse> ResendDriverCodeAsync(ResendDriverRegistrationCodeRequest request, CancellationToken cancellationToken = default);
}
