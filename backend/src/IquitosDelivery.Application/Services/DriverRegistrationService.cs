using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class DriverRegistrationService
    : EmailRegistrationServiceBase<PendingDriverRegistration>, IDriverRegistrationService
{
    private readonly IValidator<StartDriverRegistrationRequest> _startValidator;
    private readonly IValidator<VerifyDriverRegistrationCodeRequest> _verifyValidator;
    private readonly IValidator<CompleteDriverRegistrationRequest> _completeValidator;
    private readonly IValidator<ResendDriverRegistrationCodeRequest> _resendValidator;
    private readonly ILegalService _legalService;
    private readonly IPhoneOtpService _phoneOtpService;

    public DriverRegistrationService(
        IAppDbContext dbContext,
        IEmailSender emailSender,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IValidator<StartDriverRegistrationRequest> startValidator,
        IValidator<VerifyDriverRegistrationCodeRequest> verifyValidator,
        IValidator<CompleteDriverRegistrationRequest> completeValidator,
        IValidator<ResendDriverRegistrationCodeRequest> resendValidator,
        ILegalService legalService,
        IPhoneOtpService phoneOtpService)
        : base(dbContext, emailSender, jwtTokenService, passwordHasher)
    {
        _startValidator = startValidator;
        _verifyValidator = verifyValidator;
        _completeValidator = completeValidator;
        _resendValidator = resendValidator;
        _legalService = legalService;
        _phoneOtpService = phoneOtpService;
    }

    public async Task<VerificationCodeResponse> StartDriverRegistrationAsync(StartDriverRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        await _startValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var phoneNormalized = NormalizePhone(request.Phone);
        var identityDocumentNumberNormalized = NormalizeIdentityDocumentNumber(request.IdentityDocumentNumber);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);
        await EnsurePhoneAndIdentityAreAvailableAsync(phoneNormalized, identityDocumentNumberNormalized, email, cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);

        var registration = await GetLatestPendingRegistrationAsync(email, cancellationToken);
        if (registration is null)
        {
            registration = new PendingDriverRegistration
            {
                Id = Guid.NewGuid(),
                Email = email
            };

            DbContext.Add(registration);
        }

        registration.FirstName = request.FirstName.Trim();
        registration.LastName = request.LastName.Trim();
        registration.Phone = request.Phone.Trim();
        registration.PhoneNormalized = phoneNormalized;
        registration.IdentityDocumentType = "DNI";
        registration.IdentityDocumentNumber = request.IdentityDocumentNumber.Trim();
        registration.IdentityDocumentNumberNormalized = identityDocumentNumberNormalized;
        registration.VehicleType = request.VehicleType;
        registration.Plate = request.Plate.Trim();
        registration.ZoneId = request.ZoneId;
        registration.IdentityDocumentUrl = string.IsNullOrWhiteSpace(request.IdentityDocumentUrl) ? null : request.IdentityDocumentUrl.Trim();
        registration.VehiclePhotoUrl = string.IsNullOrWhiteSpace(request.VehiclePhotoUrl) ? null : request.VehiclePhotoUrl.Trim();

        await SendVerificationCodeAsync(registration, cancellationToken);

        return CreateCodeResponse(email, "Verification code sent successfully.");
    }

    public async Task<VerificationStatusResponse> VerifyDriverCodeAsync(VerifyDriverRegistrationCodeRequest request, CancellationToken cancellationToken = default)
    {
        await _verifyValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);

        return await VerifyCodeAsync(registration, email, request.Code, cancellationToken);
    }

    public async Task<AuthResponse> CompleteDriverRegistrationAsync(CompleteDriverRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        await _completeValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);

        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);
        await EnsureZoneExistsAsync(registration.ZoneId, cancellationToken);
        EnsureRegistrationIdentityIsComplete(registration);
        await EnsurePhoneAndIdentityAreAvailableAsync(registration.PhoneNormalized, registration.IdentityDocumentNumberNormalized, email, cancellationToken);
        await PrepareCompletionAsync(registration, request.Code, cancellationToken);
        var isPhoneVerified = await _phoneOtpService.ConsumeVerifiedOtpAsync(registration.PhoneNormalized ?? string.Empty, "Registration", cancellationToken);

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = registration.FirstName,
            LastName = registration.LastName,
            Phone = registration.Phone,
            PhoneNormalized = registration.PhoneNormalized,
            IsPhoneVerified = isPhoneVerified,
            PhoneVerifiedAtUtc = isPhoneVerified ? DateTime.UtcNow : null,
            IdentityDocumentType = registration.IdentityDocumentType,
            IdentityDocumentNumber = registration.IdentityDocumentNumber,
            IdentityDocumentNumberNormalized = registration.IdentityDocumentNumberNormalized,
            Email = registration.Email,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = UserRole.Driver,
            Status = UserStatus.Pending
        };

        var driverProfile = new DriverProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            VehicleType = registration.VehicleType,
            Plate = registration.Plate,
            ZoneId = registration.ZoneId,
            ApprovalStatus = ApprovalStatus.Pending,
            TrustLevel = TrustLevel.Verified,
            CompletedDeliveriesCount = 0,
            TrustScore = 0m,
            IdentityDocumentUrl = registration.IdentityDocumentUrl,
            VehiclePhotoUrl = registration.VehiclePhotoUrl,
            IsAvailable = false
        };
        user.DriverProfile = driverProfile;

        MarkRegistrationAsCompleted(registration);

        DbContext.Add(user);
        DbContext.Add(driverProfile);
        await _legalService.EnsureDocumentsAcceptedAsync(user.Id, "Driver", request.AcceptedDocumentIds.ToHashSet(), request.Platform, request.AppVersion, null, null, cancellationToken);
        await DbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            Token = JwtTokenService.GenerateToken(user),
            UserId = user.Id,
            FullName = BuildFullName(user.FirstName, user.LastName),
            Email = user.Email,
            Role = user.Role.ToString(),
            Status = user.Status.ToString()
        };
    }

    public async Task<VerificationCodeResponse> ResendDriverCodeAsync(ResendDriverRegistrationCodeRequest request, CancellationToken cancellationToken = default)
    {
        await _resendValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);

        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);
        EnsureRegistrationCanContinue(registration);
        await EnsureZoneExistsAsync(registration.ZoneId, cancellationToken);

        await SendVerificationCodeAsync(registration, cancellationToken);

        return CreateCodeResponse(email, "A new verification code was sent successfully.");
    }

    private async Task EnsureZoneExistsAsync(Guid zoneId, CancellationToken cancellationToken)
    {
        var exists = await DbContext.Zones.AnyAsync(x => x.Id == zoneId && x.IsActive, cancellationToken);
        if (!exists)
        {
            throw new NotFoundException("The selected zone was not found.");
        }
    }

    private async Task<PendingDriverRegistration?> GetLatestPendingRegistrationAsync(string email, CancellationToken cancellationToken)
    {
        return await DbContext.PendingDriverRegistrations
            .Where(x => x.Email == email && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<PendingDriverRegistration> GetRequiredPendingRegistrationAsync(string email, CancellationToken cancellationToken)
    {
        var registration = await GetLatestPendingRegistrationAsync(email, cancellationToken);
        if (registration is null)
        {
            throw new NotFoundException("Pending driver registration was not found.");
        }

        return registration;
    }
}
