using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace IquitosDelivery.Application.Services;

public class AuthService : IAuthService
{
    private const int PasswordResetCodeExpirationMinutes = 10;
    private const int PasswordResetCodeLength = 6;
    private const int MaxPasswordResetVerifyAttempts = 5;

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailSender _emailSender;
    private readonly IGoogleTokenVerifier _googleTokenVerifier;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IValidator<ForgotPasswordRequest> _forgotPasswordValidator;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidator<GoogleLoginRequest> _googleLoginValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterDriverRequest> _registerDriverValidator;
    private readonly IValidator<RegisterRestaurantRequest> _registerRestaurantValidator;
    private readonly IValidator<ResendPasswordResetCodeRequest> _resendPasswordResetCodeValidator;
    private readonly IValidator<ResetPasswordRequest> _resetPasswordValidator;
    private readonly ILegalService _legalService;

    public AuthService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IEmailSender emailSender,
        IGoogleTokenVerifier googleTokenVerifier,
        IJwtTokenService jwtTokenService,
        IValidator<ForgotPasswordRequest> forgotPasswordValidator,
        IPasswordHasher passwordHasher,
        IValidator<GoogleLoginRequest> googleLoginValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterDriverRequest> registerDriverValidator,
        IValidator<RegisterRestaurantRequest> registerRestaurantValidator,
        IValidator<ResendPasswordResetCodeRequest> resendPasswordResetCodeValidator,
        IValidator<ResetPasswordRequest> resetPasswordValidator,
        ILegalService legalService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _emailSender = emailSender;
        _googleTokenVerifier = googleTokenVerifier;
        _jwtTokenService = jwtTokenService;
        _forgotPasswordValidator = forgotPasswordValidator;
        _passwordHasher = passwordHasher;
        _googleLoginValidator = googleLoginValidator;
        _loginValidator = loginValidator;
        _registerDriverValidator = registerDriverValidator;
        _registerRestaurantValidator = registerRestaurantValidator;
        _resendPasswordResetCodeValidator = resendPasswordResetCodeValidator;
        _resetPasswordValidator = resetPasswordValidator;
        _legalService = legalService;
    }

    public async Task<AuthResponse> RegisterRestaurantAsync(RegisterRestaurantRequest request, CancellationToken cancellationToken = default)
    {
        await _registerRestaurantValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var phoneNormalized = IdentityNormalization.NormalizePeruvianMobilePhone(request.Phone);
        var identityDocumentNumberNormalized = IdentityNormalization.NormalizeIdentityDocumentNumber(request.IdentityDocumentNumber);
        await EnsureEmailIsUniqueAsync(email, cancellationToken);
        await EnsurePhoneAndIdentityAreUniqueAsync(phoneNormalized, identityDocumentNumberNormalized, cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);
        var businessTypeId = await ResolveRestaurantBusinessTypeIdAsync(request.BusinessTypeId, cancellationToken);

        var user = CreateUser(request.FirstName, request.LastName, request.Phone, phoneNormalized, request.IdentityDocumentNumber, identityDocumentNumberNormalized, email, request.Password, UserRole.Restaurant, UserStatus.Pending);
        var restaurant = new Restaurant
        {
            Id = Guid.NewGuid(),
            OwnerUserId = user.Id,
            OwnerUser = user,
            Name = request.RestaurantName.Trim(),
            Description = request.Description.Trim(),
            Address = request.Address.Trim(),
            Reference = request.Reference.Trim(),
            ZoneId = request.ZoneId,
            BusinessTypeId = businessTypeId,
            ApprovalStatus = ApprovalStatus.Pending,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim(),
            IsActive = false
        };

        _dbContext.Add(user);
        _dbContext.Add(restaurant);
        await _legalService.EnsureDocumentsAcceptedAsync(user.Id, "Restaurant", request.AcceptedDocumentIds.ToHashSet(), request.Platform, request.AppVersion, null, null, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> RegisterDriverAsync(RegisterDriverRequest request, CancellationToken cancellationToken = default)
    {
        await _registerDriverValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var phoneNormalized = IdentityNormalization.NormalizePeruvianMobilePhone(request.Phone);
        var identityDocumentNumberNormalized = IdentityNormalization.NormalizeIdentityDocumentNumber(request.IdentityDocumentNumber);
        await EnsureEmailIsUniqueAsync(email, cancellationToken);
        await EnsurePhoneAndIdentityAreUniqueAsync(phoneNormalized, identityDocumentNumberNormalized, cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);

        var user = CreateUser(request.FirstName, request.LastName, request.Phone, phoneNormalized, request.IdentityDocumentNumber, identityDocumentNumberNormalized, email, request.Password, UserRole.Driver, UserStatus.Pending);
        var driverProfile = new DriverProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            VehicleType = request.VehicleType,
            Plate = request.Plate.Trim(),
            ZoneId = request.ZoneId,
            ApprovalStatus = ApprovalStatus.Pending,
            TrustLevel = TrustLevel.Verified,
            CompletedDeliveriesCount = 0,
            TrustScore = 0m,
            IdentityDocumentUrl = string.IsNullOrWhiteSpace(request.IdentityDocumentUrl) ? null : request.IdentityDocumentUrl.Trim(),
            VehiclePhotoUrl = string.IsNullOrWhiteSpace(request.VehiclePhotoUrl) ? null : request.VehiclePhotoUrl.Trim(),
            IsAvailable = false
        };
        user.DriverProfile = driverProfile;

        _dbContext.Add(user);
        _dbContext.Add(driverProfile);
        await _legalService.EnsureDocumentsAcceptedAsync(user.Id, "Driver", request.AcceptedDocumentIds.ToHashSet(), request.Platform, request.AppVersion, null, null, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        await _loginValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var user = _dbContext.Users
            .Include(x => x.CustomerProfile)
            .Include(x => x.OwnedRestaurants)
            .Include(x => x.DriverProfile)
            .Include(x => x.CollaboratorProfile)
            .Include(x => x.CommunityCollaborator)
            .FirstOrDefault(x => x.Email == email);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (user.Status == UserStatus.Suspended)
        {
            throw new UnauthorizedException("Your account is suspended.");
        }

        return await Task.FromResult(CreateAuthResponse(user));
    }

    public async Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default)
    {
        await _googleLoginValidator.ValidateAndThrowAsync(request, cancellationToken);

        var googleUser = await _googleTokenVerifier.VerifyIdTokenAsync(request.IdToken, cancellationToken);

        if (!googleUser.EmailVerified)
        {
            throw new UnauthorizedException("Google account email is not verified.");
        }

        var normalizedEmail = NormalizeEmail(googleUser.Email);
        var user = _dbContext.Users
            .Include(x => x.CustomerProfile)
            .Include(x => x.OwnedRestaurants)
            .Include(x => x.DriverProfile)
            .Include(x => x.CollaboratorProfile)
            .Include(x => x.CommunityCollaborator)
            .FirstOrDefault(x => x.GoogleSubject == googleUser.Subject);

        if (user is null)
        {
            user = _dbContext.Users
                .Include(x => x.CustomerProfile)
                .Include(x => x.OwnedRestaurants)
                .Include(x => x.DriverProfile)
                .Include(x => x.CollaboratorProfile)
                .Include(x => x.CommunityCollaborator)
                .FirstOrDefault(x => x.Email == normalizedEmail);
        }

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = string.IsNullOrWhiteSpace(googleUser.GivenName) ? googleUser.FullName.Trim() : googleUser.GivenName.Trim(),
                LastName = string.IsNullOrWhiteSpace(googleUser.FamilyName) ? "-" : googleUser.FamilyName.Trim(),
                Phone = string.Empty,
                PhoneNormalized = null,
                IsPhoneVerified = false,
                IdentityDocumentType = IdentityNormalization.DefaultIdentityDocumentType,
                IdentityDocumentNumber = null,
                IdentityDocumentNumberNormalized = null,
                Email = normalizedEmail,
                PasswordHash = string.Empty,
                GoogleSubject = googleUser.Subject,
                Role = UserRole.Customer,
                Status = UserStatus.Active
            };

            var customerProfile = new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                User = user
            };

            _dbContext.Add(user);
            _dbContext.Add(customerProfile);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return CreateAuthResponse(user);
        }

        if (user.Role != UserRole.Customer)
        {
            throw new UnauthorizedException("This Google login is only enabled for customer accounts.");
        }

        if (user.Status == UserStatus.Suspended)
        {
            throw new UnauthorizedException("Your account is suspended.");
        }

        if (string.IsNullOrWhiteSpace(user.GoogleSubject))
        {
            user.GoogleSubject = googleUser.Subject;
        }

        if (user.CustomerProfile is null)
        {
            var customerProfile = new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                User = user
            };

            _dbContext.Add(customerProfile);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
    }

    public async Task<VerificationCodeResponse> StartPasswordResetAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        await _forgotPasswordValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            return CreatePasswordResetCodeResponse(email);
        }

        var passwordResetRequest = await _dbContext.PasswordResetRequests
            .Where(x => x.Email == email && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (passwordResetRequest is null)
        {
            passwordResetRequest = new PasswordResetRequest
            {
                Id = Guid.NewGuid(),
                Email = email
            };

            _dbContext.Add(passwordResetRequest);
        }

        await IssuePasswordResetCodeAsync(passwordResetRequest, BuildFullName(user), cancellationToken);

        return CreatePasswordResetCodeResponse(email);
    }

    public async Task<VerificationCodeResponse> ResendPasswordResetCodeAsync(ResendPasswordResetCodeRequest request, CancellationToken cancellationToken = default)
    {
        await _resendPasswordResetCodeValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            return CreatePasswordResetCodeResponse(email);
        }

        var passwordResetRequest = await _dbContext.PasswordResetRequests
            .Where(x => x.Email == email && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (passwordResetRequest is null)
        {
            passwordResetRequest = new PasswordResetRequest
            {
                Id = Guid.NewGuid(),
                Email = email
            };

            _dbContext.Add(passwordResetRequest);
        }

        await IssuePasswordResetCodeAsync(passwordResetRequest, BuildFullName(user), cancellationToken);

        return CreatePasswordResetCodeResponse(email);
    }

    public async Task<VerificationStatusResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        await _resetPasswordValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken)
            ?? throw new AppException("No se pudo completar la recuperación de contraseña.");

        var passwordResetRequest = await _dbContext.PasswordResetRequests
            .Where(x => x.Email == email && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new AppException("Solicita un nuevo código para recuperar tu contraseña.");

        await ValidatePasswordResetCodeAsync(passwordResetRequest, request.Code.Trim(), cancellationToken);

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        passwordResetRequest.IsCompleted = true;
        passwordResetRequest.CompletedAtUtc = DateTime.UtcNow;
        passwordResetRequest.CodeHash = string.Empty;
        passwordResetRequest.CodeExpiresAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VerificationStatusResponse
        {
            Email = email,
            IsVerified = true,
            Message = "Password updated successfully."
        };
    }

    public async Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var user = _dbContext.Users
            .Include(x => x.CustomerProfile)
            .Include(x => x.OwnedRestaurants)
            .Include(x => x.DriverProfile)
            .Include(x => x.CollaboratorProfile)
            .Include(x => x.CommunityCollaborator)
            .FirstOrDefault(x => x.Id == _currentUserService.UserId.Value);

        if (user is null)
        {
            throw new NotFoundException("Authenticated user was not found.");
        }

        var activeProfile = _currentUserService.ActiveProfile ?? UserProfiles.RoleToDefaultProfile(user.Role.ToString());
        var effectiveRole = UserProfiles.ProfileToEffectiveRole(activeProfile);

        return await Task.FromResult(new CurrentUserResponse
        {
            UserId = user.Id,
            FullName = BuildFullName(user),
            Email = user.Email,
            Role = effectiveRole,
            PrimaryRole = user.Role.ToString(),
            ActiveProfile = activeProfile,
            Status = user.Status.ToString(),
            TrustLevel = GetTrustLevel(user),
            TrustScore = GetTrustScore(user),
            CommunityCollaborationLevel = GetCommunityLevel(user),
            CommunityTrustScore = GetCommunityTrustScore(user),
            CommunityAvailabilityStatus = GetCommunityAvailabilityStatus(user),
            IsCommunityAvailable = user.CommunityCollaborator?.IsAvailable,
            HasCustomerProfile = user.CustomerProfile is not null,
            HasBusinessProfile = user.OwnedRestaurants.Any(),
            HasDriverProfile = user.DriverProfile is not null,
            HasCollaboratorProfile = user.CollaboratorProfile is not null,
            CollaboratorApprovalStatus = user.CollaboratorProfile?.ApprovalStatus.ToString(),
            IsCollaboratorIdentityVerified = user.CollaboratorProfile?.IsIdentityVerified,
            AvailableProfiles = GetAvailableProfiles(user),
            IsAuthenticated = true
        });
    }

    public async Task<AuthResponse> SwitchProfileAsync(SwitchProfileRequest request, CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Tu sesión ha vencido. Inicia sesión nuevamente.");
        }

        if (string.IsNullOrWhiteSpace(request?.Profile) || !UserProfiles.IsValidProfile(request.Profile.Trim()))
        {
            throw new AppException("Perfil solicitado no válido.");
        }

        var targetProfile = request.Profile.Trim();

        var user = await _dbContext.Users
            .Include(x => x.CustomerProfile)
            .Include(x => x.OwnedRestaurants)
            .Include(x => x.DriverProfile)
            .Include(x => x.CollaboratorProfile)
            .Include(x => x.CommunityCollaborator)
            .FirstOrDefaultAsync(x => x.Id == _currentUserService.UserId.Value, cancellationToken)
            ?? throw new NotFoundException("Usuario no encontrado.");

        if (user.Status == UserStatus.Suspended)
        {
            throw new UnauthorizedException("Tu cuenta se encuentra suspendida.");
        }

        var availableProfiles = GetAvailableProfiles(user);
        if (!availableProfiles.Contains(targetProfile, StringComparer.Ordinal))
        {
            if (targetProfile == UserProfiles.Collaborator)
            {
                if (user.CollaboratorProfile is null)
                {
                    throw new ForbiddenException("Solicita la verificación para hacer favores.");
                }
                throw new ForbiddenException("Tu perfil de colaborador aún no está aprobado.");
            }

            throw new ForbiddenException("Este modo aún no está disponible para tu cuenta.");
        }

        // Automatic creation of CustomerProfile if switching to Customer
        if (targetProfile == UserProfiles.Customer && user.CustomerProfile is null)
        {
            var customerProfile = new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                User = user
            };
            _dbContext.Add(customerProfile);
            user.CustomerProfile = customerProfile;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return CreateAuthResponse(user, targetProfile);
    }

    private async Task EnsureEmailIsUniqueAsync(string email, CancellationToken cancellationToken)
    {
        var exists = _dbContext.Users.Any(x => x.Email == email);

        if (exists)
        {
            throw new AppException("An account with this email already exists.");
        }

        await Task.CompletedTask;
    }

    private async Task EnsurePhoneAndIdentityAreUniqueAsync(
        string phoneNormalized,
        string identityDocumentNumberNormalized,
        CancellationToken cancellationToken)
    {
        var phoneExists = await _dbContext.Users.AnyAsync(x => x.PhoneNormalized == phoneNormalized, cancellationToken)
            || await _dbContext.PendingCustomerRegistrations.AnyAsync(x => !x.IsCompleted && x.PhoneNormalized == phoneNormalized, cancellationToken)
            || await _dbContext.PendingRestaurantRegistrations.AnyAsync(x => !x.IsCompleted && x.PhoneNormalized == phoneNormalized, cancellationToken)
            || await _dbContext.PendingDriverRegistrations.AnyAsync(x => !x.IsCompleted && x.PhoneNormalized == phoneNormalized, cancellationToken);

        if (phoneExists)
        {
            throw new AppException("Ya existe una cuenta o registro pendiente con este celular.");
        }

        var identityExists = await _dbContext.Users.AnyAsync(x => x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken)
            || await _dbContext.PendingCustomerRegistrations.AnyAsync(x => !x.IsCompleted && x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken)
            || await _dbContext.PendingRestaurantRegistrations.AnyAsync(x => !x.IsCompleted && x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken)
            || await _dbContext.PendingDriverRegistrations.AnyAsync(x => !x.IsCompleted && x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken);

        if (identityExists)
        {
            throw new AppException("Ya existe una cuenta o registro pendiente con este DNI.");
        }
    }

    private async Task EnsureZoneExistsAsync(Guid zoneId, CancellationToken cancellationToken)
    {
        var exists = _dbContext.Zones.Any(x => x.Id == zoneId);

        if (!exists)
        {
            throw new NotFoundException("The selected zone was not found.");
        }

        await Task.CompletedTask;
    }

    private async Task<Guid> ResolveRestaurantBusinessTypeIdAsync(Guid? businessTypeId, CancellationToken cancellationToken)
    {
        if (!businessTypeId.HasValue || businessTypeId.Value == Guid.Empty)
        {
            throw new NotFoundException("The selected business type was not found.");
        }

        var requestedTypeExists = await _dbContext.BusinessTypes
            .AnyAsync(x => x.Id == businessTypeId.Value && x.IsActive, cancellationToken);

        if (!requestedTypeExists)
        {
            throw new NotFoundException("The selected business type was not found.");
        }

        return businessTypeId.Value;
    }

    private User CreateUser(
        string firstName,
        string lastName,
        string phone,
        string phoneNormalized,
        string identityDocumentNumber,
        string identityDocumentNumberNormalized,
        string email,
        string password,
        UserRole role,
        UserStatus status)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Phone = phone.Trim(),
            PhoneNormalized = phoneNormalized,
            IsPhoneVerified = false,
            IdentityDocumentType = IdentityNormalization.DefaultIdentityDocumentType,
            IdentityDocumentNumber = identityDocumentNumber.Trim(),
            IdentityDocumentNumberNormalized = identityDocumentNumberNormalized,
            Email = email,
            PasswordHash = _passwordHasher.Hash(password),
            Role = role,
            Status = status
        };
    }

    private AuthResponse CreateAuthResponse(User user, string? requestedProfile = null)
    {
        var availableProfiles = GetAvailableProfiles(user);
        var activeProfile = string.IsNullOrWhiteSpace(requestedProfile)
            ? UserProfiles.RoleToDefaultProfile(user.Role.ToString())
            : requestedProfile;
        var effectiveRole = UserProfiles.ProfileToEffectiveRole(activeProfile);

        return new AuthResponse
        {
            Token = _jwtTokenService.GenerateToken(user, activeProfile),
            UserId = user.Id,
            FullName = BuildFullName(user),
            Email = user.Email,
            Role = effectiveRole,
            PrimaryRole = user.Role.ToString(),
            ActiveProfile = activeProfile,
            Status = user.Status.ToString(),
            TrustLevel = GetTrustLevel(user),
            TrustScore = GetTrustScore(user),
            CommunityCollaborationLevel = GetCommunityLevel(user),
            CommunityTrustScore = GetCommunityTrustScore(user),
            CommunityAvailabilityStatus = GetCommunityAvailabilityStatus(user),
            IsCommunityAvailable = user.CommunityCollaborator?.IsAvailable,
            HasCustomerProfile = user.CustomerProfile is not null,
            HasBusinessProfile = user.OwnedRestaurants.Any(),
            HasDriverProfile = user.DriverProfile is not null,
            HasCollaboratorProfile = user.CollaboratorProfile is not null,
            CollaboratorApprovalStatus = user.CollaboratorProfile?.ApprovalStatus.ToString(),
            IsCollaboratorIdentityVerified = user.CollaboratorProfile?.IsIdentityVerified,
            AvailableProfiles = availableProfiles
        };
    }

    private static string BuildFullName(User user)
    {
        return $"{user.FirstName} {user.LastName}".Trim();
    }

    private async Task IssuePasswordResetCodeAsync(
        PasswordResetRequest passwordResetRequest,
        string recipientName,
        CancellationToken cancellationToken)
    {
        var code = GeneratePasswordResetCode();
        passwordResetRequest.CodeHash = _passwordHasher.Hash(code);
        passwordResetRequest.CodeExpiresAtUtc = DateTime.UtcNow.AddMinutes(PasswordResetCodeExpirationMinutes);
        passwordResetRequest.VerifyAttempts = 0;
        passwordResetRequest.LastSentAtUtc = DateTime.UtcNow;
        passwordResetRequest.SendCount += 1;
        passwordResetRequest.IsCompleted = false;
        passwordResetRequest.CompletedAtUtc = null;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _emailSender.SendPasswordResetCodeAsync(
            passwordResetRequest.Email,
            recipientName,
            code,
            PasswordResetCodeExpirationMinutes,
            cancellationToken);
    }

    private async Task ValidatePasswordResetCodeAsync(
        PasswordResetRequest passwordResetRequest,
        string code,
        CancellationToken cancellationToken)
    {
        if (passwordResetRequest.CodeExpiresAtUtc < DateTime.UtcNow)
        {
            throw new AppException("Verification code has expired. Please request a new code.");
        }

        if (_passwordHasher.Verify(code, passwordResetRequest.CodeHash))
        {
            return;
        }

        passwordResetRequest.VerifyAttempts += 1;
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (passwordResetRequest.VerifyAttempts >= MaxPasswordResetVerifyAttempts)
        {
            throw new AppException("Too many verification attempts. Please request a new code.");
        }

        throw new AppException("Verification code is invalid.");
    }

    private static VerificationCodeResponse CreatePasswordResetCodeResponse(string email)
    {
        return new VerificationCodeResponse
        {
            Email = email,
            ExpiresInMinutes = PasswordResetCodeExpirationMinutes,
            Message = "If the account exists, we sent a recovery code."
        };
    }

    private static string? GetTrustLevel(User user)
    {
        return user.DriverProfile?.TrustLevel.ToString();
    }

    private static decimal? GetTrustScore(User user)
    {
        return user.DriverProfile?.TrustScore;
    }

    private static string? GetCommunityLevel(User user)
    {
        return user.CommunityCollaborator?.CollaborationLevel.ToString();
    }

    private static decimal? GetCommunityTrustScore(User user)
    {
        return user.CommunityCollaborator?.TrustScore;
    }

    private static string? GetCommunityAvailabilityStatus(User user)
    {
        return user.CommunityCollaborator?.AvailabilityStatus.ToString();
    }

    private static string[] GetAvailableProfiles(User user)
    {
        var profiles = new List<string>();

        if (user.Role is UserRole.Customer or UserRole.Restaurant or UserRole.Driver || user.CustomerProfile is not null)
        {
            profiles.Add(UserProfiles.Customer);
        }

        if (user.OwnedRestaurants.Any() || user.Role == UserRole.Restaurant)
        {
            profiles.Add(UserProfiles.BusinessOwner);
        }

        if (user.DriverProfile is not null || user.Role == UserRole.Driver)
        {
            profiles.Add(UserProfiles.Driver);
        }

        var isApprovedCollaborator = user.CollaboratorProfile is not null &&
                                     user.CollaboratorProfile.ApprovalStatus == ApprovalStatus.Approved &&
                                     user.CollaboratorProfile.IsIdentityVerified;

        if (isApprovedCollaborator)
        {
            profiles.Add(UserProfiles.Collaborator);
        }

        if (user.Role == UserRole.Admin)
        {
            profiles.Add(UserProfiles.Admin);
        }

        return profiles.Distinct(StringComparer.Ordinal).ToArray();
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string GeneratePasswordResetCode()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString($"D{PasswordResetCodeLength}");
    }
}
