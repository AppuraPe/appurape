using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class LegalDocument : BaseEntity
{
    public string Type { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public LegalDocumentStatus Status { get; set; }
    public DateTime? EffectiveAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public ICollection<UserLegalAcceptance> Acceptances { get; set; } = new List<UserLegalAcceptance>();
}
