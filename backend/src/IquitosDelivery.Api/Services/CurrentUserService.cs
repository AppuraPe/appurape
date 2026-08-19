using System.Security.Claims;
using IquitosDelivery.Application.Interfaces;

namespace IquitosDelivery.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var value = GetClaim(ClaimTypes.NameIdentifier) ?? GetClaim(ClaimTypes.Name);
            return Guid.TryParse(value, out var userId) ? userId : null;
        }
    }

    public string? Email => GetClaim(ClaimTypes.Email);

    public string? Role => GetClaim(ClaimTypes.Role);

    public string? ActiveProfile => GetClaim("active_profile");

    public string? PrimaryRole => GetClaim("primary_role");

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    private string? GetClaim(string claimType)
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(claimType)?.Value;
    }
}
