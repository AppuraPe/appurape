using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class CustomerRegistrationService
    : EmailRegistrationServiceBase<PendingCustomerRegistration>, ICustomerRegistrationService
{
    private readonly IValidator<StartCustomerRegistrationRequest> _startValidator;
    private readonly IValidator<VerifyCustomerRegistrationCodeRequest> _verifyValidator;
    private readonly IValidator<CompleteCustomerRegistrationRequest> _completeValidator;
    private readonly IValidator<ResendCustomerRegistrationCodeRequest> _resendValidator;

    public CustomerRegistrationService(
        IAppDbContext dbContext,
        IEmailSender emailSender,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IValidator<StartCustomerRegistrationRequest> startValidator,
        IValidator<VerifyCustomerRegistrationCodeRequest> verifyValidator,
        IValidator<CompleteCustomerRegistrationRequest> completeValidator,
        IValidator<ResendCustomerRegistrationCodeRequest> resendValidator)
        : base(dbContext, emailSender, jwtTokenService, passwordHasher)
    {
        _startValidator = startValidator;
        _verifyValidator = verifyValidator;
        _completeValidator = completeValidator;
        _resendValidator = resendValidator;
    }

    public async Task<VerificationCodeResponse> StartRegistrationAsync(StartCustomerRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        await _startValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);

        var registration = await GetLatestPendingRegistrationAsync(email, cancellationToken);
        if (registration is null)
        {
            registration = new PendingCustomerRegistration
            {
                Id = Guid.NewGuid(),
                Email = email
            };

            DbContext.Add(registration);
        }

        registration.FirstName = request.FirstName.Trim();
        registration.LastName = request.LastName.Trim();
        registration.Phone = request.Phone.Trim();

        await SendVerificationCodeAsync(registration, cancellationToken);

        return CreateCodeResponse(email, "Verification code sent successfully.");
    }

    public async Task<VerificationStatusResponse> VerifyCodeAsync(VerifyCustomerRegistrationCodeRequest request, CancellationToken cancellationToken = default)
    {
        await _verifyValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);

        return await VerifyCodeAsync(registration, email, request.Code, cancellationToken);
    }

    public async Task<AuthResponse> CompleteRegistrationAsync(CompleteCustomerRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        await _completeValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);

        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);
        await PrepareCompletionAsync(registration, request.Code, cancellationToken);

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = registration.FirstName,
            LastName = registration.LastName,
            Phone = registration.Phone,
            Email = registration.Email,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = UserRole.Customer,
            Status = UserStatus.Active
        };

        var customerProfile = new CustomerProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user
        };

        MarkRegistrationAsCompleted(registration);

        DbContext.Add(user);
        DbContext.Add(customerProfile);
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

    public async Task<VerificationCodeResponse> ResendCodeAsync(ResendCustomerRegistrationCodeRequest request, CancellationToken cancellationToken = default)
    {
        await _resendValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsAvailableAsync(email, cancellationToken);

        var registration = await GetRequiredPendingRegistrationAsync(email, cancellationToken);
        EnsureRegistrationCanContinue(registration);

        await SendVerificationCodeAsync(registration, cancellationToken);

        return CreateCodeResponse(email, "A new verification code was sent successfully.");
    }

    private async Task<PendingCustomerRegistration?> GetLatestPendingRegistrationAsync(string email, CancellationToken cancellationToken)
    {
        return await DbContext.PendingCustomerRegistrations
            .Where(x => x.Email == email && !x.IsCompleted)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<PendingCustomerRegistration> GetRequiredPendingRegistrationAsync(string email, CancellationToken cancellationToken)
    {
        var registration = await GetLatestPendingRegistrationAsync(email, cancellationToken);

        if (registration is null)
        {
            throw new NotFoundException("Pending customer registration was not found.");
        }

        return registration;
    }
}
