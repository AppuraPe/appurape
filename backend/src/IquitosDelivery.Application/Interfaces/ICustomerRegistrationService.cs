using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Interfaces;

public interface ICustomerRegistrationService
{
    Task<VerificationCodeResponse> StartRegistrationAsync(StartCustomerRegistrationRequest request, CancellationToken cancellationToken = default);

    Task<VerificationStatusResponse> VerifyCodeAsync(VerifyCustomerRegistrationCodeRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> CompleteRegistrationAsync(CompleteCustomerRegistrationRequest request, CancellationToken cancellationToken = default);

    Task<VerificationCodeResponse> ResendCodeAsync(ResendCustomerRegistrationCodeRequest request, CancellationToken cancellationToken = default);
}
