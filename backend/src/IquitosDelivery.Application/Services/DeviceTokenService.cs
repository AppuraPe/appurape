using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class DeviceTokenService : IDeviceTokenService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public DeviceTokenService(IAppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task RegisterAsync(RegisterDeviceTokenRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        var token = NormalizeRequired(request.Token, "token");
        var platform = NormalizeRequired(request.Platform, "platform").ToLowerInvariant();
        var utcNow = DateTime.UtcNow;

        var existingToken = await _dbContext.UserDeviceTokens
            .FirstOrDefaultAsync(x => x.Token == token, cancellationToken);

        if (existingToken is null)
        {
            _dbContext.Add(new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Role = user.Role,
                Token = token,
                Platform = platform,
                DeviceId = NormalizeOptional(request.DeviceId),
                AppVersion = NormalizeOptional(request.AppVersion),
                IsActive = true,
                LastSeenAtUtc = utcNow
            });
        }
        else
        {
            existingToken.UserId = user.Id;
            existingToken.Role = user.Role;
            existingToken.Platform = platform;
            existingToken.DeviceId = NormalizeOptional(request.DeviceId);
            existingToken.AppVersion = NormalizeOptional(request.AppVersion);
            existingToken.IsActive = true;
            existingToken.LastSeenAtUtc = utcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateAsync(DeactivateDeviceTokenRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("No authenticated user was found.");
        var token = NormalizeRequired(request.Token, "token");

        var existingToken = await _dbContext.UserDeviceTokens
            .FirstOrDefaultAsync(x => x.Token == token, cancellationToken);

        if (existingToken is null || existingToken.UserId != userId)
        {
            return;
        }

        existingToken.IsActive = false;
        existingToken.LastSeenAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("No authenticated user was found.");

        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

        return user ?? throw new UnauthorizedException("The authenticated user is no longer available.");
    }

    private static string NormalizeRequired(string? value, string fieldName)
    {
        var normalized = value?.Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new AppException($"The field '{fieldName}' is required.");
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
