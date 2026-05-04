using IquitosDelivery.Application.DTOs.Search;

namespace IquitosDelivery.Application.Interfaces;

public interface ISearchService
{
    Task<PublicSearchResponse> SearchPublicAsync(string? query, CancellationToken cancellationToken = default);
}
