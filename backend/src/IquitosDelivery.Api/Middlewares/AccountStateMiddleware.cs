using System.Security.Claims;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Api.Middlewares;

public sealed class AccountStateMiddleware
{
    private readonly RequestDelegate _next;
    public AccountStateMiddleware(RequestDelegate next) => _next = next;
    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var exempt = path.StartsWith("/api/account/deletion", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/legal", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/health", StringComparison.OrdinalIgnoreCase);
        var idValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!exempt && Guid.TryParse(idValue, out var userId))
        {
            var status = await dbContext.Users.Where(x => x.Id == userId).Select(x => x.Status).FirstOrDefaultAsync(context.RequestAborted);
            if (status == UserStatus.PendingDeletion)
            {
                context.Response.StatusCode = StatusCodes.Status423Locked;
                await context.Response.WriteAsJsonAsync(new { message = "La cuenta está programada para eliminación." }, context.RequestAborted);
                return;
            }
        }
        await _next(context);
    }
}
