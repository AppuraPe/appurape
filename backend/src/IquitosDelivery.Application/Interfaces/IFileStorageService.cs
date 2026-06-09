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
}
