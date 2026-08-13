using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using IquitosDelivery.Infrastructure.Persistence;

namespace IquitosDelivery.Api.Services;

public sealed class AccountDeletionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AccountDeletionWorker> _logger;
    public AccountDeletionWorker(IServiceScopeFactory scopeFactory, ILogger<AccountDeletionWorker> logger) { _scopeFactory = scopeFactory; _logger = logger; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcessDueAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "Account deletion processing failed."); }
            try { await Task.Delay(TimeSpan.FromHours(1), stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    private async Task ProcessDueAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var due = await db.AccountDeletionRequests
            .Include(x => x.User).ThenInclude(x => x.CollaboratorProfile)
            .Where(x => x.Status == AccountDeletionStatus.PendingDeletion && x.ScheduledForUtc <= DateTime.UtcNow)
            .ToListAsync(cancellationToken);
        foreach (var request in due)
        {
            var user = request.User;
            var profile = user.CollaboratorProfile;
            if (profile is not null)
            {
                if (!string.IsNullOrWhiteSpace(profile.IdentityDocumentUrl)) await SafeDeletePrivateAsync(storage, profile.IdentityDocumentUrl, cancellationToken);
                if (!string.IsNullOrWhiteSpace(profile.LiveSelfieUrl)) await SafeDeletePrivateAsync(storage, profile.LiveSelfieUrl, cancellationToken);
                if (!string.IsNullOrWhiteSpace(profile.ProfilePhotoUrl)) await SafeDeletePublicAsync(storage, profile.ProfilePhotoUrl, cancellationToken);
                profile.IdentityDocumentUrl = null; profile.LiveSelfieUrl = null; profile.ProfilePhotoUrl = null; profile.IdentityDocumentNumber = null; profile.Notes = null; profile.IsIdentityVerified = false;
            }
            var customerId = await db.Customers.Where(x => x.UserId == user.Id).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
            if (customerId.HasValue) await db.CustomerAddresses.Where(x => x.CustomerProfileId == customerId.Value).ExecuteDeleteAsync(cancellationToken);
            var tokens = await db.UserDeviceTokens.Where(x => x.UserId == user.Id).ToListAsync(cancellationToken);
            foreach (var token in tokens) token.IsActive = false;
            var suffix = user.Id.ToString("N");
            user.FirstName = "Cuenta"; user.LastName = "eliminada"; user.Phone = string.Empty;
            user.Email = $"deleted-{suffix}@appurape.invalid"; user.GoogleSubject = null;
            user.PasswordHash = Guid.NewGuid().ToString("N"); user.Status = UserStatus.Suspended;
            request.Status = AccountDeletionStatus.Completed; request.CompletedAtUtc = DateTime.UtcNow;
        }
        if (due.Count > 0) await db.SaveChangesAsync(cancellationToken);
    }

    private async Task SafeDeletePrivateAsync(IFileStorageService storage, string path, CancellationToken token) { try { await storage.DeletePrivateAsync(path, token); } catch (Exception ex) { _logger.LogWarning(ex, "Private evidence deletion failed."); } }
    private async Task SafeDeletePublicAsync(IFileStorageService storage, string url, CancellationToken token) { try { await storage.DeleteByPublicUrlAsync(url, token); } catch (Exception ex) { _logger.LogWarning(ex, "Public profile deletion failed."); } }
}
