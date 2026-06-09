using Google.Apis.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Security;

public class GoogleTokenVerifier : IGoogleTokenVerifier
{
    private readonly GoogleAuthSettings _settings;

    public GoogleTokenVerifier(IOptions<GoogleAuthSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var allowedClientIds = _settings.AllowedClientIds
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (allowedClientIds.Length == 0)
        {
            throw new AppException("Google login is not configured.");
        }

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = allowedClientIds
                });
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedException("Invalid Google identity token.");
        }

        return new GoogleUserInfo(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.GivenName ?? string.Empty,
            payload.FamilyName ?? string.Empty,
            payload.Name ?? payload.Email);
    }
}
