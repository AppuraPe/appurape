namespace IquitosDelivery.Application.DTOs.Legal;

public sealed class LegalDocumentResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? EffectiveAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
}

public sealed class LegalConsentStatusResponse
{
    public bool IsRequired { get; set; }
    public IReadOnlyList<LegalDocumentResponse> RequiredDocuments { get; set; } = [];
    public IReadOnlyList<Guid> AcceptedDocumentIds { get; set; } = [];
}

public sealed class AcceptLegalDocumentsRequest
{
    public IReadOnlyList<Guid> DocumentIds { get; set; } = [];
    public string? Platform { get; set; }
    public string? AppVersion { get; set; }
}

public sealed class CreateLegalDocumentRequest
{
    public string Type { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public DateTime? EffectiveAtUtc { get; set; }
}
