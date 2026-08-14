using IquitosDelivery.Application.Interfaces;

namespace IquitosDelivery.Api.Services;

public sealed class HttpRequestAuditContext(IHttpContextAccessor accessor) : IRequestAuditContext
{
    public string? IpAddress => accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
    public string? UserAgent => accessor.HttpContext?.Request.Headers.UserAgent.FirstOrDefault();
    public string? IdempotencyKey => accessor.HttpContext?.Request.Headers["Idempotency-Key"].FirstOrDefault();
}
