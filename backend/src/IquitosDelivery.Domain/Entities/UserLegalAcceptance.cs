using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class UserLegalAcceptance : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid LegalDocumentId { get; set; }
    public LegalDocument LegalDocument { get; set; } = null!;
    public string DocumentVersion { get; set; } = string.Empty;
    public string DocumentHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime AcceptedAtUtc { get; set; }
    public string? Platform { get; set; }
    public string? AppVersion { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
