using System.Security.Cryptography;
using IquitosDelivery.Application.DTOs.Account;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public sealed class AccountDeletionService : IAccountDeletionService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailSender _emailSender;
    private readonly IPasswordHasher _passwordHasher;
    public AccountDeletionService(IAppDbContext dbContext, ICurrentUserService currentUser, IEmailSender emailSender, IPasswordHasher passwordHasher)
    { _dbContext = dbContext; _currentUser = currentUser; _emailSender = emailSender; _passwordHasher = passwordHasher; }

    public async Task StartAsync(StartAccountDeletionRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null) return;
        var active = await _dbContext.AccountDeletionRequests.Where(x => x.UserId == user.Id && x.Status != AccountDeletionStatus.Completed && x.Status != AccountDeletionStatus.Cancelled).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        if (active is null)
        {
            active = new AccountDeletionRequest { Id = Guid.NewGuid(), UserId = user.Id, Status = AccountDeletionStatus.CodeSent };
            _dbContext.Add(active);
        }
        active.VerificationCodeHash = _passwordHasher.Hash(code);
        active.CodeExpiresAtUtc = DateTime.UtcNow.AddMinutes(10);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _emailSender.SendVerificationCodeAsync(user.Email, $"{user.FirstName} {user.LastName}".Trim(), code, 10, cancellationToken);
    }

    public async Task<AccountDeletionStatusResponse> ConfirmAsync(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken) ?? throw new AppException("Código inválido o vencido.");
        var deletion = await _dbContext.AccountDeletionRequests.Where(x => x.UserId == user.Id && x.Status != AccountDeletionStatus.Completed && x.Status != AccountDeletionStatus.Cancelled).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken) ?? throw new AppException("Código inválido o vencido.");
        if (deletion.CodeExpiresAtUtc < DateTime.UtcNow || !_passwordHasher.Verify(request.Code.Trim(), deletion.VerificationCodeHash)) throw new AppException("Código inválido o vencido.");
        deletion.Status = AccountDeletionStatus.PendingDeletion;
        deletion.PreviousUserStatus = user.Status;
        deletion.ConfirmedAtUtc = DateTime.UtcNow;
        deletion.ScheduledForUtc = DateTime.UtcNow.AddDays(7);
        user.Status = UserStatus.PendingDeletion;
        var tokens = await _dbContext.UserDeviceTokens.Where(x => x.UserId == user.Id).ToListAsync(cancellationToken);
        foreach (var token in tokens) token.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(deletion);
    }

    public async Task<AccountDeletionStatusResponse> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var deletion = await _dbContext.AccountDeletionRequests.Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);
        return deletion is null ? new AccountDeletionStatusResponse() : Map(deletion);
    }

    public async Task<AccountDeletionStatusResponse> CancelAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var user = await _dbContext.Users.FirstAsync(x => x.Id == userId, cancellationToken);
        var deletion = await _dbContext.AccountDeletionRequests.Where(x => x.UserId == userId && x.Status == AccountDeletionStatus.PendingDeletion).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken) ?? throw new AppException("No existe una eliminación pendiente.");
        deletion.Status = AccountDeletionStatus.Cancelled;
        deletion.CancelledAtUtc = DateTime.UtcNow;
        user.Status = deletion.PreviousUserStatus;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(deletion);
    }

    public async Task StartCancellationAsync(StartAccountDeletionRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null) return;
        var deletion = await _dbContext.AccountDeletionRequests.Where(x => x.UserId == user.Id && x.Status == AccountDeletionStatus.PendingDeletion).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);
        if (deletion is null) return;
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        deletion.VerificationCodeHash = _passwordHasher.Hash(code);
        deletion.CodeExpiresAtUtc = DateTime.UtcNow.AddMinutes(10);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _emailSender.SendVerificationCodeAsync(user.Email, $"{user.FirstName} {user.LastName}".Trim(), code, 10, cancellationToken);
    }

    public async Task<AccountDeletionStatusResponse> CancelWithCodeAsync(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken) ?? throw new AppException("Código inválido o vencido.");
        var deletion = await _dbContext.AccountDeletionRequests.Where(x => x.UserId == user.Id && x.Status == AccountDeletionStatus.PendingDeletion).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken) ?? throw new AppException("Código inválido o vencido.");
        if (deletion.CodeExpiresAtUtc < DateTime.UtcNow || !_passwordHasher.Verify(request.Code.Trim(), deletion.VerificationCodeHash)) throw new AppException("Código inválido o vencido.");
        deletion.Status = AccountDeletionStatus.Cancelled; deletion.CancelledAtUtc = DateTime.UtcNow; user.Status = deletion.PreviousUserStatus;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(deletion);
    }

    private static AccountDeletionStatusResponse Map(AccountDeletionRequest x) => new() { Status = x.Status.ToString(), ScheduledForUtc = x.ScheduledForUtc, CanCancel = x.Status == AccountDeletionStatus.PendingDeletion };
}
