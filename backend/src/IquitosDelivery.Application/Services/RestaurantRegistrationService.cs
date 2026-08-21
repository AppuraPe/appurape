using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class RestaurantRegistrationService
    : EmailRegistrationServiceBase<PendingRestaurantRegistration>, IRestaurantRegistrationService
{
    private readonly IValidator<StartRestaurantRegistrationRequest> _startValidator;
    private readonly IValidator<VerifyRestaurantRegistrationCodeRequest> _verifyValidator;
    private readonly IValidator<CompleteRestaurantRegistrationRequest> _completeValidator;
    private readonly IValidator<ResendRestaurantRegistrationCodeRequest> _resendValidator;
    private readonly ILegalService _legalService;
    private readonly IPhoneOtpService _phoneOtpService;

    public RestaurantRegistrationService(
        IAppDbContext dbContext,
        IEmailSender emailSender,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IValidator<StartRestaurantRegistrationRequest> startValidator,
        IValidator<VerifyRestaurantRegistrationCodeRequest> verifyValidator,
        IValidator<CompleteRestaurantRegistrationRequest> completeValidator,
        IValidator<ResendRestaurantRegistrationCodeRequest> resendValidator,
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

    public async Task<VerificationCodeResponse> StartRestaurantRegistrationAsync(StartRestaurantRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        await _startValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var phoneNormalized = NormalizePhone(request.Phone);
        var identityDocumentNumberNormalized = NormalizeIdentityDocumentNumber(request.IdentityDocumentNumber);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);
        await EnsurePhoneAndIdentityAreAvailableAsync(phoneNormalized, identityDocumentNumberNormalized, email, cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);
        var businessTypeId = await ResolveRestaurantBusinessTypeIdAsync(request.BusinessTypeId, cancellationToken);

        var registration = await GetLatestPendingRegistrationAsync(email, cancellationToken);
        if (registration is null)
        {
            registration = new PendingRestaurantRegistration
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
        registration.RestaurantName = request.RestaurantName.Trim();
        registration.Description = request.Description.Trim();
        registration.Address = request.Address.Trim();
        registration.Reference = request.Reference.Trim();
        registration.ZoneId = request.ZoneId;
        registration.BusinessTypeId = businessTypeId;
        registration.OpenTime = request.OpenTime;
        registration.CloseTime = request.CloseTime;
        registration.LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();

        await SendVerificationCodeAsync(registration, cancellationToken);

        return CreateCodeResponse(email, "Verification code sent successfully.");
    }

    public async Task<VerificationStatusResponse> VerifyRestaurantCodeAsync(VerifyRestaurantRegistrationCodeRequest request, CancellationToken cancellationToken = default)
    {
        await _verifyValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);

        return await VerifyCodeAsync(registration, email, request.Code, cancellationToken);
    }

    public async Task<AuthResponse> CompleteRestaurantRegistrationAsync(CompleteRestaurantRegistrationRequest request, CancellationToken cancellationToken = default)
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
            Role = UserRole.Restaurant,
            Status = UserStatus.Pending
        };

        var restaurant = new Restaurant
        {
            Id = Guid.NewGuid(),
            OwnerUserId = user.Id,
            OwnerUser = user,
            Name = registration.RestaurantName,
            Description = registration.Description,
            Address = registration.Address,
            Reference = registration.Reference,
            ZoneId = registration.ZoneId,
            BusinessTypeId = registration.BusinessTypeId,
            ApprovalStatus = ApprovalStatus.Pending,
            OpenTime = registration.OpenTime,
            CloseTime = registration.CloseTime,
            LogoUrl = registration.LogoUrl,
            IsActive = false
        };

        MarkRegistrationAsCompleted(registration);

        DbContext.Add(user);
        DbContext.Add(restaurant);
        await _legalService.EnsureDocumentsAcceptedAsync(user.Id, "Restaurant", request.AcceptedDocumentIds.ToHashSet(), request.Platform, request.AppVersion, null, null, cancellationToken);
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

    public async Task<VerificationCodeResponse> ResendRestaurantCodeAsync(ResendRestaurantRegistrationCodeRequest request, CancellationToken cancellationToken = default)
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

    private async Task<PendingRestaurantRegistration?> GetLatestPendingRegistrationAsync(string email, CancellationToken cancellationToken)
    {
        return await DbContext.PendingRestaurantRegistrations
            .Where(x => x.Email == email && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<PendingRestaurantRegistration> GetRequiredPendingRegistrationAsync(string email, CancellationToken cancellationToken)
    {
        var registration = await GetLatestPendingRegistrationAsync(email, cancellationToken);
        if (registration is null)
        {
            throw new NotFoundException("Pending restaurant registration was not found.");
        }

        return registration;
    }

    private async Task<Guid> ResolveRestaurantBusinessTypeIdAsync(Guid? businessTypeId, CancellationToken cancellationToken)
    {
        if (!businessTypeId.HasValue || businessTypeId.Value == Guid.Empty)
        {
            throw new NotFoundException("The selected business type was not found.");
        }

        var requestedTypeExists = await DbContext.BusinessTypes
            .AnyAsync(x => x.Id == businessTypeId.Value && x.IsActive, cancellationToken);

        if (!requestedTypeExists)
        {
            throw new NotFoundException("The selected business type was not found.");
        }

        return businessTypeId.Value;
    }
}
