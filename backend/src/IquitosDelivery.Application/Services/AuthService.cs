using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterDriverRequest> _registerDriverValidator;
    private readonly IValidator<RegisterRestaurantRequest> _registerRestaurantValidator;

    public AuthService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterDriverRequest> registerDriverValidator,
        IValidator<RegisterRestaurantRequest> registerRestaurantValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
        _loginValidator = loginValidator;
        _registerDriverValidator = registerDriverValidator;
        _registerRestaurantValidator = registerRestaurantValidator;
    }

    public async Task<AuthResponse> RegisterRestaurantAsync(RegisterRestaurantRequest request, CancellationToken cancellationToken = default)
    {
        await _registerRestaurantValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsUniqueAsync(email, cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);

        var user = CreateUser(request.FirstName, request.LastName, request.Phone, email, request.Password, UserRole.Restaurant, UserStatus.Pending);
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
            ApprovalStatus = ApprovalStatus.Pending,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            IsActive = false
        };

        _dbContext.Add(user);
        _dbContext.Add(restaurant);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> RegisterDriverAsync(RegisterDriverRequest request, CancellationToken cancellationToken = default)
    {
        await _registerDriverValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        await EnsureEmailIsUniqueAsync(email, cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);

        var user = CreateUser(request.FirstName, request.LastName, request.Phone, email, request.Password, UserRole.Driver, UserStatus.Pending);
        var driverProfile = new DriverProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            VehicleType = request.VehicleType,
            Plate = request.Plate.Trim(),
            ZoneId = request.ZoneId,
            ApprovalStatus = ApprovalStatus.Pending,
            IsAvailable = false
        };

        _dbContext.Add(user);
        _dbContext.Add(driverProfile);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        await _loginValidator.ValidateAndThrowAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var user = _dbContext.Users.FirstOrDefault(x => x.Email == email);

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

    public async Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var user = _dbContext.Users.FirstOrDefault(x => x.Id == _currentUserService.UserId.Value);

        if (user is null)
        {
            throw new NotFoundException("Authenticated user was not found.");
        }

        return await Task.FromResult(new CurrentUserResponse
        {
            UserId = user.Id,
            FullName = BuildFullName(user),
            Email = user.Email,
            Role = user.Role.ToString(),
            Status = user.Status.ToString(),
            IsAuthenticated = true
        });
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

    private async Task EnsureZoneExistsAsync(Guid zoneId, CancellationToken cancellationToken)
    {
        var exists = _dbContext.Zones.Any(x => x.Id == zoneId);

        if (!exists)
        {
            throw new NotFoundException("The selected zone was not found.");
        }

        await Task.CompletedTask;
    }

    private User CreateUser(string firstName, string lastName, string phone, string email, string password, UserRole role, UserStatus status)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Phone = phone.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(password),
            Role = role,
            Status = status
        };
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        return new AuthResponse
        {
            Token = _jwtTokenService.GenerateToken(user),
            UserId = user.Id,
            FullName = BuildFullName(user),
            Email = user.Email,
            Role = user.Role.ToString(),
            Status = user.Status.ToString()
        };
    }

    private static string BuildFullName(User user)
    {
        return $"{user.FirstName} {user.LastName}".Trim();
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
