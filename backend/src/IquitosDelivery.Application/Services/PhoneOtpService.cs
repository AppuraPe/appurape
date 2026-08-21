using System.Security.Cryptography;
using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class PhoneOtpService : IPhoneOtpService
{
    private const int VerificationCodeLength = 6;
    private const int ExpirationMinutes = 5;
    private const int MaxVerifyAttempts = 5;

    private readonly IAppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPhoneOtpSender _phoneOtpSender;
    private readonly IValidator<StartPhoneOtpRequest> _startValidator;
    private readonly IValidator<VerifyPhoneOtpRequest> _verifyValidator;

    public PhoneOtpService(
        IAppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IPhoneOtpSender phoneOtpSender,
        IValidator<StartPhoneOtpRequest> startValidator,
        IValidator<VerifyPhoneOtpRequest> verifyValidator)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _phoneOtpSender = phoneOtpSender;
        _startValidator = startValidator;
        _verifyValidator = verifyValidator;
    }

    public async Task<PhoneOtpResponse> StartAsync(StartPhoneOtpRequest request, CancellationToken cancellationToken = default)
    {
        await _startValidator.ValidateAndThrowAsync(request, cancellationToken);

        var phoneNormalized = IdentityNormalization.NormalizePeruvianMobilePhone(request.Phone);
        var purpose = NormalizePurpose(request.Purpose);
        var code = GenerateVerificationCode();

        var challenge = await GetLatestOpenChallengeAsync(phoneNormalized, purpose, cancellationToken);
        if (challenge is null)
        {
            challenge = new PhoneOtpChallenge
            {
                Id = Guid.NewGuid(),
                PhoneNormalized = phoneNormalized,
                Purpose = purpose
            };
            _dbContext.Add(challenge);
        }

        challenge.CodeHash = _passwordHasher.Hash(code);
        challenge.CodeExpiresAtUtc = DateTime.UtcNow.AddMinutes(ExpirationMinutes);
        challenge.IsVerified = false;
        challenge.VerifiedAtUtc = null;
        challenge.IsCompleted = false;
        challenge.CompletedAtUtc = null;
        challenge.VerifyAttempts = 0;
        challenge.SendCount += 1;
        challenge.LastSentAtUtc = DateTime.UtcNow;
        challenge.Channel = "WhatsApp";
        challenge.ProviderMessageId = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var sendResult = await _phoneOtpSender.SendAsync(phoneNormalized, code, ExpirationMinutes, cancellationToken);
        challenge.Channel = sendResult.Channel;
        challenge.ProviderMessageId = sendResult.ProviderMessageId;
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (!sendResult.Sent)
        {
            throw new AppException(sendResult.ErrorMessage ?? "No se pudo enviar el código por WhatsApp.");
        }

        return new PhoneOtpResponse
        {
            PhoneMasked = MaskPhone(phoneNormalized),
            Purpose = purpose,
            Channel = sendResult.Channel,
            ExpiresInMinutes = ExpirationMinutes,
            Message = "Te enviamos un código por WhatsApp."
        };
    }

    public async Task<PhoneOtpVerificationResponse> VerifyAsync(VerifyPhoneOtpRequest request, CancellationToken cancellationToken = default)
    {
        await _verifyValidator.ValidateAndThrowAsync(request, cancellationToken);

        var phoneNormalized = IdentityNormalization.NormalizePeruvianMobilePhone(request.Phone);
        var purpose = NormalizePurpose(request.Purpose);
        var challenge = await GetLatestOpenChallengeAsync(phoneNormalized, purpose, cancellationToken)
            ?? throw new AppException("Solicita un nuevo código de WhatsApp.");

        EnsureChallengeCanContinue(challenge);

        if (challenge.CodeExpiresAtUtc < DateTime.UtcNow)
        {
            throw new AppException("El código de WhatsApp expiró. Solicita uno nuevo.");
        }

        if (!_passwordHasher.Verify(request.Code.Trim(), challenge.CodeHash))
        {
            challenge.VerifyAttempts += 1;
            await _dbContext.SaveChangesAsync(cancellationToken);

            if (challenge.VerifyAttempts >= MaxVerifyAttempts)
            {
                throw new AppException("Demasiados intentos. Solicita un nuevo código de WhatsApp.");
            }

            throw new AppException("El código de WhatsApp no es válido.");
        }

        challenge.IsVerified = true;
        challenge.VerifiedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new PhoneOtpVerificationResponse
        {
            PhoneMasked = MaskPhone(phoneNormalized),
            Purpose = purpose,
            IsVerified = true,
            Message = "Celular verificado correctamente."
        };
    }

    public async Task<bool> HasVerifiedOtpAsync(string phoneNormalized, string purpose, CancellationToken cancellationToken = default)
    {
        var normalizedPurpose = NormalizePurpose(purpose);
        return await _dbContext.PhoneOtpChallenges
            .AnyAsync(x => x.PhoneNormalized == phoneNormalized
                && x.Purpose == normalizedPurpose
                && x.IsVerified
                && !x.IsCompleted
                && x.CodeExpiresAtUtc >= DateTime.UtcNow,
                cancellationToken);
    }

    public async Task<bool> ConsumeVerifiedOtpAsync(string phoneNormalized, string purpose, CancellationToken cancellationToken = default)
    {
        var normalizedPurpose = NormalizePurpose(purpose);
        var challenge = await _dbContext.PhoneOtpChallenges
            .Where(x => x.PhoneNormalized == phoneNormalized
                && x.Purpose == normalizedPurpose
                && x.IsVerified
                && !x.IsCompleted
                && x.CodeExpiresAtUtc >= DateTime.UtcNow)
            .OrderByDescending(x => x.VerifiedAtUtc ?? x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (challenge is null)
        {
            return false;
        }

        challenge.IsCompleted = true;
        challenge.CompletedAtUtc = DateTime.UtcNow;
        challenge.CodeHash = string.Empty;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<PhoneOtpChallenge?> GetLatestOpenChallengeAsync(string phoneNormalized, string purpose, CancellationToken cancellationToken)
    {
        return await _dbContext.PhoneOtpChallenges
            .Where(x => x.PhoneNormalized == phoneNormalized && x.Purpose == purpose && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static void EnsureChallengeCanContinue(PhoneOtpChallenge challenge)
    {
        if (challenge.IsCompleted)
        {
            throw new AppException("Este código ya fue usado.");
        }

        if (challenge.VerifyAttempts >= MaxVerifyAttempts && !challenge.IsVerified)
        {
            throw new AppException("Demasiados intentos. Solicita un nuevo código de WhatsApp.");
        }
    }

    private static string NormalizePurpose(string? purpose)
    {
        return string.IsNullOrWhiteSpace(purpose) ? "Registration" : purpose.Trim();
    }

    private static string GenerateVerificationCode()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString($"D{VerificationCodeLength}");
    }

    private static string MaskPhone(string phoneNormalized)
    {
        if (phoneNormalized.Length <= 4)
        {
            return "****";
        }

        return $"{phoneNormalized[..2]}*****{phoneNormalized[^4..]}";
    }
}
