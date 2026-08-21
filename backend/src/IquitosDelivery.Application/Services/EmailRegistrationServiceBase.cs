using System.Security.Cryptography;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public abstract class EmailRegistrationServiceBase<TRegistration>
    where TRegistration : PendingEmailRegistrationBase
{
    protected const int VerificationCodeExpirationMinutes = 10;
    private const int VerificationCodeLength = 6;
    private const int MaxVerifyAttempts = 5;

    protected readonly IAppDbContext DbContext;
    protected readonly IEmailSender EmailSender;
    protected readonly IJwtTokenService JwtTokenService;
    protected readonly IPasswordHasher PasswordHasher;

    protected EmailRegistrationServiceBase(
        IAppDbContext dbContext,
        IEmailSender emailSender,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher)
    {
        DbContext = dbContext;
        EmailSender = emailSender;
        JwtTokenService = jwtTokenService;
        PasswordHasher = passwordHasher;
    }

    protected async Task EnsureEmailIsAvailableAsync(string email, CancellationToken cancellationToken)
    {
        var exists = await DbContext.Users.AnyAsync(x => x.Email == email, cancellationToken);

        if (exists)
        {
            throw new AppException("An account with this email already exists.");
        }
    }

    protected async Task EnsurePhoneAndIdentityAreAvailableAsync(
        string? phoneNormalized,
        string? identityDocumentNumberNormalized,
        string currentEmail,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(phoneNormalized))
        {
            var phoneExists = await DbContext.Users.AnyAsync(x => x.PhoneNormalized == phoneNormalized, cancellationToken)
                || await DbContext.PendingCustomerRegistrations.AnyAsync(x => !x.IsCompleted && x.Email != currentEmail && x.PhoneNormalized == phoneNormalized, cancellationToken)
                || await DbContext.PendingRestaurantRegistrations.AnyAsync(x => !x.IsCompleted && x.Email != currentEmail && x.PhoneNormalized == phoneNormalized, cancellationToken)
                || await DbContext.PendingDriverRegistrations.AnyAsync(x => !x.IsCompleted && x.Email != currentEmail && x.PhoneNormalized == phoneNormalized, cancellationToken);

            if (phoneExists)
            {
                throw new AppException("Ya existe una cuenta o registro pendiente con este celular.");
            }
        }

        if (!string.IsNullOrWhiteSpace(identityDocumentNumberNormalized))
        {
            var identityExists = await DbContext.Users.AnyAsync(x => x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken)
                || await DbContext.PendingCustomerRegistrations.AnyAsync(x => !x.IsCompleted && x.Email != currentEmail && x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken)
                || await DbContext.PendingRestaurantRegistrations.AnyAsync(x => !x.IsCompleted && x.Email != currentEmail && x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken)
                || await DbContext.PendingDriverRegistrations.AnyAsync(x => !x.IsCompleted && x.Email != currentEmail && x.IdentityDocumentNumberNormalized == identityDocumentNumberNormalized, cancellationToken);

            if (identityExists)
            {
                throw new AppException("Ya existe una cuenta o registro pendiente con este DNI.");
            }
        }
    }

    protected static string NormalizePhone(string phone)
    {
        return IdentityNormalization.NormalizePeruvianMobilePhone(phone);
    }

    protected static string NormalizeIdentityDocumentNumber(string identityDocumentNumber)
    {
        return IdentityNormalization.NormalizeIdentityDocumentNumber(identityDocumentNumber);
    }

    protected void EnsureRegistrationCanContinue(TRegistration registration)
    {
        if (registration.IsCompleted)
        {
            throw new AppException("This registration has already been completed.");
        }

        if (registration.VerifyAttempts >= MaxVerifyAttempts && !registration.IsVerified)
        {
            throw new AppException("Too many verification attempts. Please request a new code.");
        }
    }

    protected static void EnsureRegistrationIdentityIsComplete(TRegistration registration)
    {
        if (!IdentityNormalization.IsValidPeruvianMobilePhone(registration.PhoneNormalized)
            || !IdentityNormalization.IsValidPeruvianDni(registration.IdentityDocumentNumberNormalized))
        {
            throw new AppException("Actualiza tus datos de registro para incluir DNI y celular válidos.");
        }
    }

    protected void ApplyVerificationCode(TRegistration registration, string code, DateTime utcNow)
    {
        registration.VerificationCodeHash = PasswordHasher.Hash(code);
        registration.CodeExpiresAtUtc = utcNow.AddMinutes(VerificationCodeExpirationMinutes);
        registration.IsVerified = false;
        registration.VerifiedAtUtc = null;
        registration.VerifyAttempts = 0;
        registration.SendCount += 1;
        registration.LastSentAtUtc = utcNow;
    }

    protected async Task SendVerificationCodeAsync(TRegistration registration, CancellationToken cancellationToken)
    {
        var code = GenerateVerificationCode();
        ApplyVerificationCode(registration, code, DateTime.UtcNow);
        await DbContext.SaveChangesAsync(cancellationToken);
        await EmailSender.SendVerificationCodeAsync(
            registration.Email,
            BuildFullName(registration.FirstName, registration.LastName),
            code,
            VerificationCodeExpirationMinutes,
            cancellationToken);
    }

    protected async Task<VerificationStatusResponse> VerifyCodeAsync(TRegistration registration, string email, string code, CancellationToken cancellationToken)
    {
        EnsureRegistrationCanContinue(registration);
        await ValidateCodeAsync(registration, code, requireNotExpired: true, cancellationToken);

        if (!registration.IsVerified)
        {
            registration.IsVerified = true;
            registration.VerifiedAtUtc = DateTime.UtcNow;
            await DbContext.SaveChangesAsync(cancellationToken);
        }

        return new VerificationStatusResponse
        {
            Email = email,
            IsVerified = true,
            Message = "Verification code confirmed successfully."
        };
    }

    protected async Task PrepareCompletionAsync(TRegistration registration, string code, CancellationToken cancellationToken)
    {
        EnsureRegistrationCanContinue(registration);
        await ValidateCodeAsync(registration, code, requireNotExpired: !registration.IsVerified, cancellationToken);

        if (!registration.IsVerified)
        {
            registration.IsVerified = true;
            registration.VerifiedAtUtc = DateTime.UtcNow;
        }
    }

    protected void MarkRegistrationAsCompleted(TRegistration registration)
    {
        registration.IsCompleted = true;
        registration.CompletedAtUtc = DateTime.UtcNow;
        registration.VerificationCodeHash = string.Empty;
        registration.CodeExpiresAtUtc = DateTime.UtcNow;
    }

    protected static VerificationCodeResponse CreateCodeResponse(string email, string message)
    {
        return new VerificationCodeResponse
        {
            Message = message,
            ExpiresInMinutes = VerificationCodeExpirationMinutes,
            Email = email
        };
    }

    protected static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    protected static string BuildFullName(string firstName, string lastName)
    {
        return $"{firstName} {lastName}".Trim();
    }

    private async Task ValidateCodeAsync(TRegistration registration, string code, bool requireNotExpired, CancellationToken cancellationToken)
    {
        if (requireNotExpired && registration.CodeExpiresAtUtc < DateTime.UtcNow)
        {
            throw new AppException("Verification code has expired. Please request a new code.");
        }

        if (PasswordHasher.Verify(code.Trim(), registration.VerificationCodeHash))
        {
            return;
        }

        registration.VerifyAttempts += 1;
        await DbContext.SaveChangesAsync(cancellationToken);

        if (registration.VerifyAttempts >= MaxVerifyAttempts)
        {
            throw new AppException("Too many verification attempts. Please request a new code.");
        }

        throw new AppException("Verification code is invalid.");
    }

    private static string GenerateVerificationCode()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString($"D{VerificationCodeLength}");
    }
}
