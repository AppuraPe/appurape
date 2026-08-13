namespace IquitosDelivery.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long contentLength,
        string objectPath,
        CancellationToken cancellationToken = default);

    Task DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken = default);

    Task<string> UploadPrivateImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long contentLength,
        string objectPath,
        CancellationToken cancellationToken = default);

    Task<StoredFileContent> DownloadPrivateImageAsync(string objectPath, CancellationToken cancellationToken = default);

    Task DeletePrivateAsync(string objectPath, CancellationToken cancellationToken = default);
}

public sealed record StoredFileContent(byte[] Content, string ContentType);
