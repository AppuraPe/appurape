using IquitosDelivery.Application.DTOs.Legal;

namespace IquitosDelivery.Application.Interfaces;

public interface ILegalService
{
    Task<IReadOnlyList<LegalDocumentResponse>> GetActiveDocumentsAsync(string role, CancellationToken cancellationToken = default);
    Task<LegalDocumentResponse> GetPublishedBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<LegalConsentStatusResponse> GetConsentStatusAsync(CancellationToken cancellationToken = default);
    Task<LegalConsentStatusResponse> AcceptAsync(AcceptLegalDocumentsRequest request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task EnsureDocumentsAcceptedAsync(Guid userId, string role, IReadOnlyCollection<Guid> documentIds, string? platform, string? appVersion, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task EnsureAudienceAcceptedAsync(string audience, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LegalDocumentResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LegalDocumentResponse> CreateDraftAsync(CreateLegalDocumentRequest request, CancellationToken cancellationToken = default);
    Task<LegalDocumentResponse> PublishAsync(Guid id, CancellationToken cancellationToken = default);
}
