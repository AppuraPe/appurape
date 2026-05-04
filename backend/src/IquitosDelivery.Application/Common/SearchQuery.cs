namespace IquitosDelivery.Application.Common;

internal static class SearchQuery
{
    public static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().ToLowerInvariant();
    }
}
