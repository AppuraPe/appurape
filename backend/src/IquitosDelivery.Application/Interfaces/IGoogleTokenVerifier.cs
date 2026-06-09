namespace IquitosDelivery.Application.Interfaces;

public interface IGoogleTokenVerifier
{
    Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken cancellationToken = default);
}
