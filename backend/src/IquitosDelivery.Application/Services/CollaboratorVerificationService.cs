using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class CollaboratorVerificationService : ICollaboratorVerificationService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public CollaboratorVerificationService(IAppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<CollaboratorVerificationResponse> GetMineAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var verification = await _dbContext.CollaboratorVerifications
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(MapVerification())
            .FirstOrDefaultAsync(cancellationToken);

        if (verification is not null)
        {
            return verification;
        }

        return new CollaboratorVerificationResponse
        {
            UserId = userId,
            Status = CollaboratorVerificationStatus.NotVerified.ToString(),
            VerificationFeeAmount = await GetVerificationFeeAsync(cancellationToken)
        };
    }

    public async Task<CollaboratorVerificationResponse> RequestVerificationAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var profile = await _dbContext.CollaboratorProfiles
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw new AppException("Completa tu perfil de colaborador antes de solicitar la validación.");

        if (string.IsNullOrWhiteSpace(profile.ProfilePhotoUrl) ||
            string.IsNullOrWhiteSpace(profile.IdentityDocumentUrl) ||
            string.IsNullOrWhiteSpace(profile.LiveSelfieUrl) ||
            !profile.LiveSelfieCapturedAtUtc.HasValue)
        {
            throw new AppException("Debes registrar tu foto de perfil, DNI y selfie en vivo antes de solicitar la validación.");
        }

        var active = await _dbContext.CollaboratorVerifications
            .FirstOrDefaultAsync(
                x => x.UserId == userId &&
                     (x.Status == CollaboratorVerificationStatus.PendingVerification ||
                      x.Status == CollaboratorVerificationStatus.Verified),
                cancellationToken);

        if (active is not null)
        {
            return await GetByIdAsync(active.Id, cancellationToken);
        }

        var verification = new CollaboratorVerification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = CollaboratorVerificationStatus.PendingVerification,
            VerificationFeeAmount = await GetVerificationFeeAsync(cancellationToken),
            SubmittedAtUtc = DateTime.UtcNow
        };

        _dbContext.Add(verification);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(verification.Id, cancellationToken);
    }

    public async Task<CollaboratorVerificationResponse> SubmitVerificationAsync(string profilePhotoUrl, string identityDocumentPath, string liveSelfiePath, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var user = await _dbContext.Users
            .Include(x => x.CollaboratorProfile)
            .FirstAsync(x => x.Id == userId, cancellationToken);

        var profile = user.CollaboratorProfile;
        if (profile is null)
        {
            profile = new CollaboratorProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                User = user,
                ApprovalStatus = ApprovalStatus.Pending,
                IsPhoneVerified = !string.IsNullOrWhiteSpace(user.Phone)
            };
            _dbContext.Add(profile);
        }

        profile.ProfilePhotoUrl = profilePhotoUrl;
        profile.IdentityDocumentUrl = identityDocumentPath;
        profile.LiveSelfieUrl = liveSelfiePath;
        profile.LiveSelfieCapturedAtUtc = DateTime.UtcNow;
        profile.ApprovalStatus = ApprovalStatus.Pending;
        profile.IsIdentityVerified = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await RequestVerificationAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CollaboratorVerificationResponse>> GetPendingAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.CollaboratorVerifications
            .Where(x => x.Status == CollaboratorVerificationStatus.PendingVerification)
            .OrderBy(x => x.SubmittedAtUtc)
            .Select(MapVerification())
            .ToListAsync(cancellationToken);
    }

    public async Task<CollaboratorVerificationResponse> ApproveAsync(Guid verificationId, CancellationToken cancellationToken = default)
    {
        var verification = await _dbContext.CollaboratorVerifications
            .FirstOrDefaultAsync(x => x.Id == verificationId, cancellationToken)
            ?? throw new NotFoundException("Verification request was not found.");

        if (verification.Status == CollaboratorVerificationStatus.Verified)
        {
            return await GetByIdAsync(verification.Id, cancellationToken);
        }

        if (verification.Status != CollaboratorVerificationStatus.PendingVerification)
        {
            throw new AppException("Esta verificación no se puede aprobar en su estado actual.");
        }

        var reviewedAtUtc = DateTime.UtcNow;
        verification.Status = CollaboratorVerificationStatus.Verified;
        verification.ReviewedAtUtc = reviewedAtUtc;
        verification.ReviewedByAdminId = GetCurrentUserId();
        verification.RejectReason = null;
        verification.ExpiresAtUtc = reviewedAtUtc.AddYears(1);

        var profile = await _dbContext.CollaboratorProfiles
            .FirstOrDefaultAsync(x => x.UserId == verification.UserId, cancellationToken)
            ?? throw new AppException("El usuario no tiene un perfil de colaborador completo.");

        if (string.IsNullOrWhiteSpace(profile.ProfilePhotoUrl) ||
            string.IsNullOrWhiteSpace(profile.IdentityDocumentUrl) ||
            string.IsNullOrWhiteSpace(profile.LiveSelfieUrl) ||
            !profile.LiveSelfieCapturedAtUtc.HasValue)
        {
            throw new AppException("No se puede aprobar: faltan la foto de perfil, el DNI o la selfie en vivo.");
        }

        profile.ApprovalStatus = ApprovalStatus.Approved;
        profile.IsIdentityVerified = true;

        _dbContext.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            UserId = verification.UserId,
            Type = FinancialMovementType.CollaboratorVerificationFee,
            Status = FinancialMovementStatus.Available,
            Amount = verification.VerificationFeeAmount,
            OccurredAtUtc = reviewedAtUtc,
            AvailableAtUtc = reviewedAtUtc,
            Reference = $"COLLAB-VERIFY-{verification.Id:N}",
            Description = "One-time collaborator verification fee."
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(verification.Id, cancellationToken);
    }

    public async Task<CollaboratorVerificationResponse> RejectAsync(Guid verificationId, RejectCollaboratorVerificationRequest request, CancellationToken cancellationToken = default)
    {
        var verification = await _dbContext.CollaboratorVerifications
            .FirstOrDefaultAsync(x => x.Id == verificationId, cancellationToken)
            ?? throw new NotFoundException("Verification request was not found.");

        if (verification.Status != CollaboratorVerificationStatus.PendingVerification)
        {
            throw new AppException("Esta verificación no se puede rechazar en su estado actual.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new AppException("Ingresa un motivo de rechazo.");
        }

        verification.Status = CollaboratorVerificationStatus.Rejected;
        verification.ReviewedAtUtc = DateTime.UtcNow;
        verification.ReviewedByAdminId = GetCurrentUserId();
        verification.RejectReason = request.Reason.Trim();

        var profile = await _dbContext.CollaboratorProfiles
            .FirstOrDefaultAsync(x => x.UserId == verification.UserId, cancellationToken);
        if (profile is not null)
        {
            profile.ApprovalStatus = ApprovalStatus.Rejected;
            profile.IsIdentityVerified = false;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(verification.Id, cancellationToken);
    }

    public async Task<string> GetPrivateEvidencePathAsync(Guid verificationId, string evidenceType, CancellationToken cancellationToken = default)
    {
        var profile = await _dbContext.CollaboratorVerifications
            .Where(x => x.Id == verificationId)
            .Select(x => x.User.CollaboratorProfile)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("No se encontró el perfil del colaborador.");
        return evidenceType.ToLowerInvariant() switch
        {
            "dni" when !string.IsNullOrWhiteSpace(profile.IdentityDocumentUrl) => profile.IdentityDocumentUrl,
            "selfie" when !string.IsNullOrWhiteSpace(profile.LiveSelfieUrl) => profile.LiveSelfieUrl,
            _ => throw new NotFoundException("No se encontró la evidencia solicitada.")
        };
    }

    private async Task<CollaboratorVerificationResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext.CollaboratorVerifications
            .Where(x => x.Id == id)
            .Select(MapVerification())
            .FirstAsync(cancellationToken);
    }

    private Guid GetCurrentUserId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        return _currentUserService.UserId.Value;
    }

    private async Task<decimal> GetVerificationFeeAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.CommissionRules
            .Where(x => x.Code == FinancialRuleCodes.CollaboratorVerificationFee && x.IsEnabled)
            .OrderBy(x => x.Priority)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken) switch
        {
            <= 0m => 5m,
            var amount => Math.Round(amount, 2, MidpointRounding.AwayFromZero)
        };
    }

    private static System.Linq.Expressions.Expression<Func<CollaboratorVerification, CollaboratorVerificationResponse>> MapVerification()
    {
        return x => new CollaboratorVerificationResponse
        {
            Id = x.Id,
            UserId = x.UserId,
            UserFullName = (x.User.FirstName + " " + x.User.LastName).Trim(),
            Status = x.Status.ToString(),
            VerificationFeeAmount = x.VerificationFeeAmount,
            SubmittedAtUtc = x.SubmittedAtUtc,
            ReviewedAtUtc = x.ReviewedAtUtc,
            ReviewedByAdminId = x.ReviewedByAdminId,
            RejectReason = x.RejectReason,
            ExpiresAtUtc = x.ExpiresAtUtc,
            HasProfilePhoto = x.User.CollaboratorProfile != null && x.User.CollaboratorProfile.ProfilePhotoUrl != null,
            ProfilePhotoUrl = x.User.CollaboratorProfile != null ? x.User.CollaboratorProfile.ProfilePhotoUrl : null,
            HasIdentityDocument = x.User.CollaboratorProfile != null && x.User.CollaboratorProfile.IdentityDocumentUrl != null,
            HasLiveSelfie = x.User.CollaboratorProfile != null && x.User.CollaboratorProfile.LiveSelfieUrl != null,
            LiveSelfieCapturedAtUtc = x.User.CollaboratorProfile != null ? x.User.CollaboratorProfile.LiveSelfieCapturedAtUtc : null
        };
    }
}
