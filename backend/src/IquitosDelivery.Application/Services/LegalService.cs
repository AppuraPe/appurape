using System.Security.Cryptography;
using System.Text;
using IquitosDelivery.Application.DTOs.Legal;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public sealed class LegalService : ILegalService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public LegalService(IAppDbContext dbContext, ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<LegalDocumentResponse>> GetActiveDocumentsAsync(string role, CancellationToken cancellationToken = default)
    {
        var audience = NormalizeAudience(role);
        var documents = await _dbContext.LegalDocuments
            .Where(x => x.Status == LegalDocumentStatus.Published && (x.Audience == "General" || x.Audience == audience))
            .OrderBy(x => x.Audience).ThenBy(x => x.Type)
            .ToListAsync(cancellationToken);
        return documents.Select(Map).ToList();
    }

    public async Task<LegalDocumentResponse> GetPublishedBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var document = await _dbContext.LegalDocuments
            .Where(x => x.Slug == slug.Trim().ToLower() && x.Status == LegalDocumentStatus.Published)
            .OrderByDescending(x => x.PublishedAtUtc)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("No se encontró el documento legal publicado.");
        return Map(document);
    }

    public async Task<LegalConsentStatusResponse> GetConsentStatusAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var role = _currentUser.Role ?? string.Empty;
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return new LegalConsentStatusResponse();
        var required = await GetActiveEntitiesAsync(role, cancellationToken);
        var accepted = await _dbContext.UserLegalAcceptances
            .Where(x => x.UserId == userId && required.Select(d => d.Id).Contains(x.LegalDocumentId))
            .Select(x => x.LegalDocumentId)
            .ToListAsync(cancellationToken);
        return BuildStatus(required, accepted);
    }

    public async Task<LegalConsentStatusResponse> AcceptAsync(AcceptLegalDocumentsRequest request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var role = _currentUser.Role ?? throw new UnauthorizedAccessException();
        await EnsureDocumentsAcceptedAsync(userId, role, request.DocumentIds.ToHashSet(), request.Platform, request.AppVersion, ipAddress, userAgent, cancellationToken);
        var supplemental = await _dbContext.LegalDocuments.Where(x => request.DocumentIds.Contains(x.Id) && x.Status == LegalDocumentStatus.Published && x.Audience == "Collaborator").ToListAsync(cancellationToken);
        var existing = await _dbContext.UserLegalAcceptances.Where(x => x.UserId == userId).Select(x => x.LegalDocumentId).ToListAsync(cancellationToken);
        foreach (var document in supplemental.Where(x => !existing.Contains(x.Id))) _dbContext.Add(CreateAcceptance(userId, role, document, request.Platform, request.AppVersion, ipAddress, userAgent));
        if (supplemental.Count > 0) await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetConsentStatusAsync(cancellationToken);
    }

    public async Task EnsureDocumentsAcceptedAsync(Guid userId, string role, IReadOnlyCollection<Guid> documentIds, string? platform, string? appVersion, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        var required = await GetActiveEntitiesAsync(role, cancellationToken);
        if (required.Count == 0) throw new AppException("Los documentos legales todavía no están publicados. Intenta nuevamente más tarde.");
        var existing = await _dbContext.UserLegalAcceptances.Where(x => x.UserId == userId).Select(x => x.LegalDocumentId).ToListAsync(cancellationToken);
        if (required.Any(x => !documentIds.Contains(x.Id) && !existing.Contains(x.Id))) throw new AppException("Debes aceptar todos los documentos legales vigentes.");
        foreach (var document in required.Where(x => !existing.Contains(x.Id)))
        {
            _dbContext.Add(CreateAcceptance(userId, role, document, platform, appVersion, ipAddress, userAgent));
        }
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task EnsureAudienceAcceptedAsync(string audience, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var normalized = NormalizeAudience(audience);
        var requiredIds = await _dbContext.LegalDocuments.Where(x => x.Status == LegalDocumentStatus.Published && x.Audience == normalized).Select(x => x.Id).ToListAsync(cancellationToken);
        var acceptedIds = await _dbContext.UserLegalAcceptances.Where(x => x.UserId == userId && requiredIds.Contains(x.LegalDocumentId)).Select(x => x.LegalDocumentId).ToListAsync(cancellationToken);
        if (requiredIds.Any(x => !acceptedIds.Contains(x))) throw new AppException("Debes aceptar el consentimiento para tratar DNI, foto y selfie.");
    }

    public async Task<IReadOnlyList<LegalDocumentResponse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await _dbContext.LegalDocuments.OrderBy(x => x.Type).ThenByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken)).Select(Map).ToList();

    public async Task<LegalDocumentResponse> CreateDraftAsync(CreateLegalDocumentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.ContentMarkdown) || string.IsNullOrWhiteSpace(request.Version))
            throw new AppException("Título, contenido y versión son obligatorios.");
        var document = new LegalDocument
        {
            Id = Guid.NewGuid(), Type = request.Type.Trim(), Audience = NormalizeAudience(request.Audience),
            Slug = request.Slug.Trim().ToLower(), Version = request.Version.Trim(), Title = request.Title.Trim(),
            ContentMarkdown = request.ContentMarkdown.Trim(), ContentHash = Hash(request.ContentMarkdown.Trim()),
            Status = LegalDocumentStatus.Draft, EffectiveAtUtc = request.EffectiveAtUtc
        };
        _dbContext.Add(document);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(document);
    }

    public async Task<LegalDocumentResponse> PublishAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _dbContext.LegalDocuments.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new NotFoundException("No se encontró el documento legal.");
        if (document.Status != LegalDocumentStatus.Draft) throw new AppException("Solo se pueden publicar borradores.");
        var settings = await _dbContext.PlatformSettings.FirstOrDefaultAsync(x => x.Key == "default", cancellationToken);
        if (settings is null || string.IsNullOrWhiteSpace(settings.LegalEntityName) || string.IsNullOrWhiteSpace(settings.PrivacyEmail) || string.IsNullOrWhiteSpace(settings.SupportEmail))
            throw new AppException("Configura razón social, correo de privacidad y correo de soporte antes de publicar.");
        var previous = await _dbContext.LegalDocuments.Where(x => x.Type == document.Type && x.Audience == document.Audience && x.Status == LegalDocumentStatus.Published).ToListAsync(cancellationToken);
        foreach (var item in previous) item.Status = LegalDocumentStatus.Archived;
        document.Status = LegalDocumentStatus.Published;
        document.PublishedAtUtc = DateTime.UtcNow;
        document.EffectiveAtUtc ??= DateTime.UtcNow;
        document.ContentHash = Hash(document.ContentMarkdown);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(document);
    }

    private async Task<List<LegalDocument>> GetActiveEntitiesAsync(string role, CancellationToken cancellationToken)
    {
        var audience = NormalizeAudience(role);
        return await _dbContext.LegalDocuments.Where(x => x.Status == LegalDocumentStatus.Published && (x.Audience == "General" || x.Audience == audience)).ToListAsync(cancellationToken);
    }

    private static LegalConsentStatusResponse BuildStatus(IReadOnlyCollection<LegalDocument> required, IReadOnlyCollection<Guid> accepted) => new()
    {
        IsRequired = required.Any(x => !accepted.Contains(x.Id)), RequiredDocuments = required.Select(Map).ToList(), AcceptedDocumentIds = accepted.ToList()
    };
    private static string NormalizeAudience(string value) => value.Trim().ToLowerInvariant() switch { "restaurant" or "business" or "negocio" => "Restaurant", "driver" or "repartidor" => "Driver", "customer" or "cliente" => "Customer", "collaborator" => "Collaborator", "general" => "General", "admin" => "Admin", _ => throw new AppException("Audiencia legal inválida.") };
    private static string Hash(string content) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content)));
    private static UserLegalAcceptance CreateAcceptance(Guid userId, string role, LegalDocument document, string? platform, string? appVersion, string? ipAddress, string? userAgent) => new()
    {
        Id = Guid.NewGuid(), UserId = userId, LegalDocumentId = document.Id, DocumentVersion = document.Version,
        DocumentHash = document.ContentHash, Role = NormalizeAudience(role), AcceptedAtUtc = DateTime.UtcNow,
        Platform = Trim(platform, 30), AppVersion = Trim(appVersion, 40), IpAddress = Trim(ipAddress, 64), UserAgent = Trim(userAgent, 500)
    };
    private static string? Trim(string? value, int max) => string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, max)];
    private static LegalDocumentResponse Map(LegalDocument x) => new() { Id = x.Id, Type = x.Type, Audience = x.Audience, Slug = x.Slug, Version = x.Version, Title = x.Title, ContentMarkdown = x.ContentMarkdown, ContentHash = x.ContentHash, Status = x.Status.ToString(), EffectiveAtUtc = x.EffectiveAtUtc, PublishedAtUtc = x.PublishedAtUtc };
}
