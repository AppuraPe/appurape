using IquitosDelivery.Application.DTOs.Legal;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Tests;

public class LegalServiceTests
{
    [Fact]
    public async Task StatusRequiresPublishedGeneralAndRoleDocuments()
    {
        await using var db = CreateDbContext();
        var user = SeedUser(db, UserRole.Customer);
        db.LegalDocuments.AddRange(Document("PrivacyPolicy", "General", "privacy"), Document("CustomerTerms", "Customer", "customer-terms"), Document("DriverTerms", "Driver", "driver-terms"));
        await db.SaveChangesAsync();
        var service = new LegalService(db, new CurrentUser(user));
        var status = await service.GetConsentStatusAsync();
        Assert.True(status.IsRequired);
        Assert.Equal(2, status.RequiredDocuments.Count);
    }

    [Fact]
    public async Task AcceptCreatesImmutableSnapshotAndClearsRequirement()
    {
        await using var db = CreateDbContext();
        var user = SeedUser(db, UserRole.Customer);
        var privacy = Document("PrivacyPolicy", "General", "privacy"); db.LegalDocuments.Add(privacy); await db.SaveChangesAsync();
        var service = new LegalService(db, new CurrentUser(user));
        var status = await service.AcceptAsync(new AcceptLegalDocumentsRequest { DocumentIds = [privacy.Id], Platform = "android", AppVersion = "1.0" }, "127.0.0.1", "tests");
        Assert.False(status.IsRequired);
        var acceptance = await db.UserLegalAcceptances.SingleAsync();
        Assert.Equal(privacy.ContentHash, acceptance.DocumentHash);
        Assert.Equal("android", acceptance.Platform);
    }

    private static AppDbContext CreateDbContext() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
    private static User SeedUser(AppDbContext db, UserRole role) { var user = new User { Id = Guid.NewGuid(), FirstName = "Test", LastName = "User", Email = $"{Guid.NewGuid():N}@test.local", Phone = "900000000", PasswordHash = "hash", Role = role, Status = UserStatus.Active }; db.Users.Add(user); return user; }
    private static LegalDocument Document(string type, string audience, string slug) => new() { Id = Guid.NewGuid(), Type = type, Audience = audience, Slug = slug, Version = "1.0", Title = type, ContentMarkdown = "content", ContentHash = new string('A', 64), Status = LegalDocumentStatus.Published, PublishedAtUtc = DateTime.UtcNow };
    private sealed class CurrentUser(User user) : ICurrentUserService { public Guid? UserId => user.Id; public string? Email => user.Email; public string? Role => user.Role.ToString(); public bool IsAuthenticated => true; }
}
