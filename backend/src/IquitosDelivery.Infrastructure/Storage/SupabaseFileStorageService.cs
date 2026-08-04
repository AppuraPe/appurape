using System.Net.Http.Headers;
using System.Text;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Storage;

public class SupabaseFileStorageService : IFileStorageService
{
    private const long MaxUploadSizeBytes = 5 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

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
        ValidateImageSignature(content, contentType);

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
        catch (HttpRequestException)
        {
            throw new AppException("Storage service is temporarily unavailable.");
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new AppException("The image could not be uploaded.");
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
        catch (HttpRequestException)
        {
            throw new AppException("Storage service is temporarily unavailable.");
        }

        if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
        {
            throw new AppException("The image could not be removed.");
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

        var extension = Path.GetExtension(fileName);
        if (!AllowedExtensions.Contains(extension))
        {
            throw new AppException($"The file '{fileName}' must be a JPG, PNG, or WEBP image.");
        }

        if (!AllowedContentTypes.Contains(contentType))
        {
            throw new AppException($"The file '{fileName}' must be a JPG, PNG, or WEBP image.");
        }
    }

    private static void ValidateImageSignature(Stream content, string contentType)
    {
        if (!content.CanSeek)
        {
            throw new AppException("The selected file could not be inspected.");
        }

        var originalPosition = content.Position;
        Span<byte> header = stackalloc byte[12];
        var bytesRead = content.Read(header);
        content.Position = originalPosition;

        var isValid = contentType.ToLowerInvariant() switch
        {
            "image/jpeg" => IsJpeg(header, bytesRead),
            "image/png" => IsPng(header, bytesRead),
            "image/webp" => IsWebp(header, bytesRead),
            _ => false
        };

        if (!isValid)
        {
            throw new AppException("The selected file content does not match a supported image format.");
        }
    }

    private static bool IsJpeg(ReadOnlySpan<byte> header, int bytesRead)
    {
        return bytesRead >= 3 &&
               header[0] == 0xFF &&
               header[1] == 0xD8 &&
               header[2] == 0xFF;
    }

    private static bool IsPng(ReadOnlySpan<byte> header, int bytesRead)
    {
        return bytesRead >= 8 &&
               header[0] == 0x89 &&
               header[1] == 0x50 &&
               header[2] == 0x4E &&
               header[3] == 0x47 &&
               header[4] == 0x0D &&
               header[5] == 0x0A &&
               header[6] == 0x1A &&
               header[7] == 0x0A;
    }

    private static bool IsWebp(ReadOnlySpan<byte> header, int bytesRead)
    {
        return bytesRead >= 12 &&
               header[0] == 0x52 &&
               header[1] == 0x49 &&
               header[2] == 0x46 &&
               header[3] == 0x46 &&
               header[8] == 0x57 &&
               header[9] == 0x45 &&
               header[10] == 0x42 &&
               header[11] == 0x50;
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
