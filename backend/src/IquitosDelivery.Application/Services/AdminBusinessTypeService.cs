using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using FluentValidation;
using IquitosDelivery.Application.DTOs.Businesses;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public partial class AdminBusinessTypeService : IAdminBusinessTypeService
{
    private readonly IAppDbContext _dbContext;
    private readonly IValidator<UpsertAdminBusinessTypeRequest> _upsertValidator;
    private readonly IValidator<UpdateBusinessTypeStatusRequest> _statusValidator;

    public AdminBusinessTypeService(
        IAppDbContext dbContext,
        IValidator<UpsertAdminBusinessTypeRequest> upsertValidator,
        IValidator<UpdateBusinessTypeStatusRequest> statusValidator)
    {
        _dbContext = dbContext;
        _upsertValidator = upsertValidator;
        _statusValidator = statusValidator;
    }

    public async Task<IReadOnlyList<AdminBusinessTypeResponse>> GetBusinessTypesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.BusinessTypes
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(MapResponse())
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminBusinessTypeResponse> CreateBusinessTypeAsync(UpsertAdminBusinessTypeRequest request, CancellationToken cancellationToken = default)
    {
        await _upsertValidator.ValidateAndThrowAsync(request, cancellationToken);

        var normalizedName = request.Name.Trim();
        var normalizedSlug = NormalizeSlug(request.Slug);
        await EnsureUniqueAsync(normalizedName, normalizedSlug, null, cancellationToken);

        var businessType = new BusinessType
        {
            Id = Guid.NewGuid(),
            Code = BuildCode(normalizedSlug),
            Name = normalizedName,
            Slug = normalizedSlug,
            IconKey = NormalizeOptional(request.IconKey),
            SortOrder = request.SortOrder,
            IsActive = true
        };

        _dbContext.Add(businessType);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetBusinessTypeResponseAsync(businessType.Id, cancellationToken);
    }

    public async Task<AdminBusinessTypeResponse> UpdateBusinessTypeAsync(Guid businessTypeId, UpsertAdminBusinessTypeRequest request, CancellationToken cancellationToken = default)
    {
        await _upsertValidator.ValidateAndThrowAsync(request, cancellationToken);

        var businessType = await GetRequiredBusinessTypeAsync(businessTypeId, cancellationToken);
        var normalizedName = request.Name.Trim();
        var normalizedSlug = NormalizeSlug(request.Slug);
        await EnsureUniqueAsync(normalizedName, normalizedSlug, businessType.Id, cancellationToken);

        businessType.Name = normalizedName;
        businessType.Slug = normalizedSlug;
        businessType.IconKey = NormalizeOptional(request.IconKey);
        businessType.SortOrder = request.SortOrder;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetBusinessTypeResponseAsync(businessType.Id, cancellationToken);
    }

    public async Task<AdminBusinessTypeResponse> UpdateBusinessTypeStatusAsync(Guid businessTypeId, UpdateBusinessTypeStatusRequest request, CancellationToken cancellationToken = default)
    {
        await _statusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var businessType = await GetRequiredBusinessTypeAsync(businessTypeId, cancellationToken);
        if (businessType.IsActive && !request.IsActive)
        {
            var activeCount = await _dbContext.BusinessTypes.CountAsync(x => x.IsActive, cancellationToken);
            if (activeCount <= 1)
            {
                throw new AppException("At least one active business type must remain available.");
            }
        }

        businessType.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetBusinessTypeResponseAsync(businessType.Id, cancellationToken);
    }

    private async Task<BusinessType> GetRequiredBusinessTypeAsync(Guid businessTypeId, CancellationToken cancellationToken)
    {
        var businessType = await _dbContext.BusinessTypes
            .FirstOrDefaultAsync(x => x.Id == businessTypeId, cancellationToken);

        if (businessType is null)
        {
            throw new NotFoundException("Business type was not found.");
        }

        return businessType;
    }

    private async Task<AdminBusinessTypeResponse> GetBusinessTypeResponseAsync(Guid businessTypeId, CancellationToken cancellationToken)
    {
        var response = await _dbContext.BusinessTypes
            .Where(x => x.Id == businessTypeId)
            .Select(MapResponse())
            .FirstOrDefaultAsync(cancellationToken);

        if (response is null)
        {
            throw new NotFoundException("Business type was not found.");
        }

        return response;
    }

    private async Task EnsureUniqueAsync(string name, string slug, Guid? currentId, CancellationToken cancellationToken)
    {
        var normalizedName = name.ToLowerInvariant();
        var normalizedSlug = slug.ToLowerInvariant();

        var nameExists = await _dbContext.BusinessTypes.AnyAsync(
            x => x.Id != currentId && x.Name.ToLower() == normalizedName,
            cancellationToken);

        if (nameExists)
        {
            throw new AppException("A business type with this name already exists.");
        }

        var slugExists = await _dbContext.BusinessTypes.AnyAsync(
            x => x.Id != currentId && x.Slug.ToLower() == normalizedSlug,
            cancellationToken);

        if (slugExists)
        {
            throw new AppException("A business type with this slug already exists.");
        }

        var code = BuildCode(slug);
        var codeExists = await _dbContext.BusinessTypes.AnyAsync(
            x => x.Id != currentId && x.Code.ToLower() == code.ToLower(),
            cancellationToken);

        if (codeExists && currentId is null)
        {
            throw new AppException("A business type with this slug already exists.");
        }
    }

    private static System.Linq.Expressions.Expression<Func<BusinessType, AdminBusinessTypeResponse>> MapResponse()
    {
        return x => new AdminBusinessTypeResponse
        {
            Id = x.Id,
            Name = x.Name,
            Slug = x.Slug,
            IconKey = x.IconKey,
            SortOrder = x.SortOrder,
            IsActive = x.IsActive,
            BusinessCount = x.Restaurants.Count
        };
    }

    private static string NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static string BuildCode(string slug)
    {
        return string.Concat(
            slug
                .Split('-', StringSplitOptions.RemoveEmptyEntries)
                .Select(part => char.ToUpperInvariant(part[0]) + part[1..]));
    }

    private static string NormalizeSlug(string slug)
    {
        var trimmed = slug.Trim().ToLowerInvariant();
        var normalized = trimmed.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var withoutAccents = builder.ToString().Normalize(NormalizationForm.FormC);
        var collapsed = SlugCleanupRegex().Replace(withoutAccents, "-").Trim('-');
        if (string.IsNullOrWhiteSpace(collapsed))
        {
            throw new AppException("Business type slug is invalid.");
        }

        return collapsed;
    }

    [GeneratedRegex("[^a-z0-9]+", RegexOptions.Compiled)]
    private static partial Regex SlugCleanupRegex();
}
