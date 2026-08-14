namespace IquitosDelivery.Application.Interfaces;

public interface IRequestAuditContext
{
    string? IpAddress { get; }
    string? UserAgent { get; }
    string? IdempotencyKey { get; }
}
