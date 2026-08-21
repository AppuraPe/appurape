using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Interfaces;

public interface IPhoneOtpService
{
    Task<PhoneOtpResponse> StartAsync(StartPhoneOtpRequest request, CancellationToken cancellationToken = default);

    Task<PhoneOtpVerificationResponse> VerifyAsync(VerifyPhoneOtpRequest request, CancellationToken cancellationToken = default);

    Task<bool> HasVerifiedOtpAsync(string phoneNormalized, string purpose, CancellationToken cancellationToken = default);

    Task<bool> ConsumeVerifiedOtpAsync(string phoneNormalized, string purpose, CancellationToken cancellationToken = default);
}
