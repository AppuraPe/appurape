using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Infrastructure.Storage;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Tests;

public class FileStorageSecurityTests
{
    [Fact]
    public async Task UploadImageAsync_RejectsImageWithInvalidBinarySignature()
    {
        var service = CreateService();
        await using var stream = new MemoryStream("not-an-image"u8.ToArray());

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.UploadImageAsync(
                stream,
                "proof.png",
                "image/png",
                stream.Length,
                "qa/proof.png"));

        Assert.Equal("The selected file content does not match a supported image format.", exception.Message);
    }

    [Fact]
    public async Task UploadImageAsync_RejectsUnsupportedExtension()
    {
        var service = CreateService();
        await using var stream = new MemoryStream([
            0x89, 0x50, 0x4E, 0x47,
            0x0D, 0x0A, 0x1A, 0x0A
        ]);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.UploadImageAsync(
                stream,
                "proof.gif",
                "image/png",
                stream.Length,
                "qa/proof.gif"));

        Assert.Equal("The file 'proof.gif' must be a JPG, PNG, or WEBP image.", exception.Message);
    }

    [Fact]
    public async Task UploadImageAsync_RejectsOversizedImage()
    {
        var service = CreateService();
        await using var stream = new MemoryStream([
            0xFF, 0xD8, 0xFF
        ]);

        var exception = await Assert.ThrowsAsync<AppException>(() =>
            service.UploadImageAsync(
                stream,
                "proof.jpg",
                "image/jpeg",
                5 * 1024 * 1024 + 1,
                "qa/proof.jpg"));

        Assert.Equal("The selected file exceeds the 5 MB limit.", exception.Message);
    }

    private static SupabaseFileStorageService CreateService()
    {
        return new SupabaseFileStorageService(
            new HttpClient
            {
                BaseAddress = new Uri("https://storage.example.test")
            },
            Options.Create(new StorageSettings
            {
                PublicBaseUrl = "https://cdn.example.test/appurape",
                Supabase = new SupabaseStorageSettings
                {
                    Url = "https://storage.example.test",
                    ServiceKey = "test-service-key",
                    Bucket = "appurape"
                }
            }));
    }
}
