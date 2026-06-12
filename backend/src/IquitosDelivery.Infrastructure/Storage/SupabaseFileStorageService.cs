using System.Net.Http.Headers;
using System.Text;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Storage;

public class SupabaseFileStorageService : IFileStorageService
{
    private const long MaxUploadSizeBytes = 5 * 1024 * 1024;

    private readonly HttpClient _httpClient;
    private readonly StorageSettings _storageSettings;

    public SupabaseFileStorageService(HttpClient httpClient, IOptions<StorageSettings> storageSettings)
    {
        _httpClient = httpClient;
        _storageSettings = storageSettings.Value;
    }

    public async Task<string> UploadImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long contentLength,
        string objectPath,
        CancellationToken cancellationToken = default)
    {
        ValidateSettings();
        ValidateImageUpload(fileName, contentType, contentLength);

        var normalizedPath = NormalizeObjectPath(objectPath);
        var bucket = _storageSettings.Supabase.Bucket.Trim();
        var requestUri = $"/storage/v1/object/{bucket}/{normalizedPath}";

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _storageSettings.Supabase.ServiceKey.Trim());
        request.Headers.Add("apikey", _storageSettings.Supabase.ServiceKey.Trim());
        request.Headers.Add("x-upsert", "true");

        var streamContent = new StreamContent(content);
        streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse(string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);
        streamContent.Headers.ContentLength = contentLength;
        request.Content = streamContent;

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new AppException($"Supabase storage is unreachable. Check Storage:Supabase:Url. Details: {exception.Message}");
        }

        if (!response.IsSuccessStatusCode)
        {
            var details = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new AppException(string.IsNullOrWhiteSpace(details)
                ? $"Supabase storage upload failed with status code {(int)response.StatusCode}."
                : $"Supabase storage upload failed: {details}");
        }

        return BuildPublicUrl(normalizedPath);
    }

    public async Task DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken = default)
    {
        ValidateSettings();

        var objectPath = ExtractObjectPath(publicUrl);
        if (objectPath is null)
        {
            return;
        }

        var bucket = _storageSettings.Supabase.Bucket.Trim();
        var requestUri = $"/storage/v1/object/{bucket}/{objectPath}";

        using var request = new HttpRequestMessage(HttpMethod.Delete, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _storageSettings.Supabase.ServiceKey.Trim());
        request.Headers.Add("apikey", _storageSettings.Supabase.ServiceKey.Trim());

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new AppException($"Supabase storage is unreachable. Check Storage:Supabase:Url. Details: {exception.Message}");
        }

        if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
        {
            var details = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new AppException(string.IsNullOrWhiteSpace(details)
                ? $"Supabase storage deletion failed with status code {(int)response.StatusCode}."
                : $"Supabase storage deletion failed: {details}");
        }
    }

    private void ValidateSettings()
    {
        if (string.IsNullOrWhiteSpace(_storageSettings.Supabase.Url))
        {
            throw new InvalidOperationException("Storage:Supabase:Url is not configured.");
        }

        if (string.IsNullOrWhiteSpace(_storageSettings.Supabase.ServiceKey))
        {
            throw new InvalidOperationException("Storage:Supabase:ServiceKey is not configured.");
        }

        if (string.IsNullOrWhiteSpace(_storageSettings.Supabase.Bucket))
        {
            throw new InvalidOperationException("Storage:Supabase:Bucket is not configured.");
        }
    }

    private static void ValidateImageUpload(string fileName, string contentType, long contentLength)
    {
        if (contentLength <= 0)
        {
            throw new AppException("The selected file is empty.");
        }

        if (contentLength > MaxUploadSizeBytes)
        {
            throw new AppException("The selected file exceeds the 5 MB limit.");
        }

        if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new AppException($"The file '{fileName}' must be an image.");
        }
    }

    private string BuildPublicUrl(string objectPath)
    {
        var baseUrl = string.IsNullOrWhiteSpace(_storageSettings.PublicBaseUrl)
            ? $"{_storageSettings.Supabase.Url.TrimEnd('/')}/storage/v1/object/public/{_storageSettings.Supabase.Bucket.Trim()}"
            : _storageSettings.PublicBaseUrl.TrimEnd('/');

        return $"{baseUrl}/{objectPath}";
    }

    private static string NormalizeObjectPath(string objectPath)
    {
        var normalized = objectPath.Trim().Trim('/');
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new AppException("Storage object path is required.");
        }

        return string.Join('/', normalized
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(Uri.EscapeDataString));
    }

    private string? ExtractObjectPath(string publicUrl)
    {
        if (!Uri.TryCreate(publicUrl, UriKind.Absolute, out var uri))
        {
            return null;
        }

        var publicBaseUrl = string.IsNullOrWhiteSpace(_storageSettings.PublicBaseUrl)
            ? $"{_storageSettings.Supabase.Url.TrimEnd('/')}/storage/v1/object/public/{_storageSettings.Supabase.Bucket.Trim()}"
            : _storageSettings.PublicBaseUrl.TrimEnd('/');

        if (!publicUrl.StartsWith(publicBaseUrl, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var prefixPath = new Uri(publicBaseUrl + "/").AbsolutePath.TrimEnd('/');
        var relativePath = uri.AbsolutePath.StartsWith(prefixPath, StringComparison.OrdinalIgnoreCase)
            ? uri.AbsolutePath[prefixPath.Length..].TrimStart('/')
            : string.Empty;

        return string.IsNullOrWhiteSpace(relativePath) ? null : relativePath;
    }
}
