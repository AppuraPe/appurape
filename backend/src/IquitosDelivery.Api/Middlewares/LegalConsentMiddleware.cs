using System.Security.Claims;
using IquitosDelivery.Application.Interfaces;

namespace IquitosDelivery.Api.Middlewares;

public sealed class LegalConsentMiddleware
{
    private readonly RequestDelegate _next;
    public LegalConsentMiddleware(RequestDelegate next) => _next = next;
    public async Task InvokeAsync(HttpContext context, ILegalService legalService)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var role = context.User.FindFirstValue(ClaimTypes.Role);
        var exempt = path.StartsWith("/api/legal", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/account/deletion", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/platform-settings", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/health", StringComparison.OrdinalIgnoreCase);
        if (!exempt && context.User.Identity?.IsAuthenticated == true && !string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            var status = await legalService.GetConsentStatusAsync(context.RequestAborted);
            if (status.IsRequired)
            {
                context.Response.StatusCode = StatusCodes.Status428PreconditionRequired;
                await context.Response.WriteAsJsonAsync(new { message = "Debes aceptar los documentos legales vigentes.", code = "LEGAL_CONSENT_REQUIRED" }, context.RequestAborted);
                return;
            }
        }
        await _next(context);
    }
}
