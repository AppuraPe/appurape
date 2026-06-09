using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace IquitosDelivery.Api.Controllers;

internal static class FileUploadHelper
{
    public static async Task<string?> UploadImageAsync(
        IFileStorageService storageService,
        IFormFile? file,
        string objectPath,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
        {
            return null;
        }

        await using var stream = file.OpenReadStream();
        return await storageService.UploadImageAsync(
            stream,
            file.FileName,
            file.ContentType ?? string.Empty,
            file.Length,
            objectPath,
            cancellationToken);
    }
}
