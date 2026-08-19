using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace IquitosDelivery.Infrastructure.Security;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user, string? activeProfile = null)
    {
        var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var expirationMinutes = ResolveAccessTokenLifetimeMinutes();

        var resolvedActiveProfile = string.IsNullOrWhiteSpace(activeProfile)
            ? UserProfiles.RoleToDefaultProfile(user.Role.ToString())
            : activeProfile;
        var effectiveRole = UserProfiles.ProfileToEffectiveRole(resolvedActiveProfile);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, effectiveRole),
            new("active_profile", resolvedActiveProfile),
            new("primary_role", user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private int ResolveAccessTokenLifetimeMinutes()
    {
        if (int.TryParse(_configuration["Jwt:AccessTokenLifetimeMinutes"], out var accessTokenLifetimeMinutes)
            && accessTokenLifetimeMinutes > 0)
        {
            return accessTokenLifetimeMinutes;
        }

        if (int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var legacyExpirationMinutes)
            && legacyExpirationMinutes > 0)
        {
            return legacyExpirationMinutes;
        }

        return 60;
    }
}
