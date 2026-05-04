using System.Linq.Expressions;
using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Drivers;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class AdminDriverService : IAdminDriverService
{
    private readonly IAppDbContext _dbContext;
    private readonly IValidator<UpdateAdminEntityStatusRequest> _statusValidator;

    public AdminDriverService(IAppDbContext dbContext, IValidator<UpdateAdminEntityStatusRequest> statusValidator)
    {
        _dbContext = dbContext;
        _statusValidator = statusValidator;
    }

    public async Task<IReadOnlyList<AdminDriverListItemResponse>> GetDriversAsync(
        AdminDriverFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Drivers.AsQueryable();
        var searchTerm = SearchQuery.Normalize(filters.Q);

        if (filters.ApprovalStatus.HasValue)
        {
            query = query.Where(x => x.ApprovalStatus == filters.ApprovalStatus.Value);
        }

        if (filters.IsAvailable.HasValue)
        {
            query = query.Where(x => x.IsAvailable == filters.IsAvailable.Value);
        }

        if (filters.Status.HasValue)
        {
            query = query.Where(x => x.User.Status == filters.Status.Value);
        }

        if (searchTerm is not null)
        {
            query = query.Where(x =>
                (x.User.FirstName + " " + x.User.LastName).ToLower().Contains(searchTerm) ||
                x.User.Email.ToLower().Contains(searchTerm) ||
                x.User.Phone.ToLower().Contains(searchTerm) ||
                x.Plate.ToLower().Contains(searchTerm) ||
                x.Zone.Name.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderByDescending(x => x.User.CreatedAtUtc)
            .Select(x => new AdminDriverListItemResponse
            {
                DriverId = x.Id,
                UserId = x.UserId,
                FullName = x.User.FirstName + " " + x.User.LastName,
                Email = x.User.Email,
                Phone = x.User.Phone,
                VehicleType = x.VehicleType.ToString(),
                Plate = x.Plate,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                ApprovalStatus = x.ApprovalStatus.ToString(),
                IsAvailable = x.IsAvailable,
                UserStatus = x.User.Status.ToString(),
                CreatedAtUtc = x.User.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminDriverDetailResponse> GetDriverByIdAsync(Guid driverId, CancellationToken cancellationToken = default)
    {
        var driver = await _dbContext.Drivers
            .Where(x => x.Id == driverId)
            .Select(MapAdminDriverDetail())
            .FirstOrDefaultAsync(cancellationToken);

        if (driver is null)
        {
            throw new NotFoundException("Driver was not found.");
        }

        return driver;
    }

    public async Task<AdminDriverDetailResponse> UpdateDriverStatusAsync(
        Guid driverId,
        UpdateAdminEntityStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _statusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var driver = await GetDriverForModerationAsync(driverId, cancellationToken);
        ApplyDriverAction(driver, NormalizeAction(request.Action));

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetDriverByIdAsync(driverId, cancellationToken);
    }

    public async Task<IReadOnlyList<PendingDriverResponse>> GetPendingDriversAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Drivers
            .Where(x => x.ApprovalStatus == ApprovalStatus.Pending)
            .OrderBy(x => x.User.FirstName)
            .ThenBy(x => x.User.LastName)
            .Select(MapPendingDriver())
            .ToListAsync(cancellationToken);
    }

    public async Task<PendingDriverResponse> ApproveDriverAsync(Guid driverId, CancellationToken cancellationToken = default)
    {
        var driver = await GetDriverForModerationAsync(driverId, cancellationToken);

        driver.ApprovalStatus = ApprovalStatus.Approved;
        driver.IsAvailable = true;
        driver.User.Status = UserStatus.Active;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetDriverResponseAsync(driverId, cancellationToken);
    }

    public async Task<PendingDriverResponse> RejectDriverAsync(Guid driverId, CancellationToken cancellationToken = default)
    {
        var driver = await GetDriverForModerationAsync(driverId, cancellationToken);

        driver.ApprovalStatus = ApprovalStatus.Rejected;
        driver.IsAvailable = false;
        driver.User.Status = UserStatus.Pending;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetDriverResponseAsync(driverId, cancellationToken);
    }

    private static void ApplyDriverAction(DriverProfile driver, string action)
    {
        switch (action)
        {
            case "approve":
                driver.User.Status = UserStatus.Active;
                driver.ApprovalStatus = ApprovalStatus.Approved;
                driver.IsAvailable = true;
                break;
            case "reject":
                driver.User.Status = UserStatus.Pending;
                driver.ApprovalStatus = ApprovalStatus.Rejected;
                driver.IsAvailable = false;
                break;
            case "suspend":
                driver.User.Status = UserStatus.Suspended;
                driver.IsAvailable = false;
                break;
            case "reactivate":
                if (driver.ApprovalStatus != ApprovalStatus.Approved)
                {
                    throw new AppException("Only approved drivers can be reactivated.");
                }

                driver.User.Status = UserStatus.Active;
                driver.IsAvailable = true;
                break;
            default:
                throw new AppException("Invalid admin action.");
        }
    }

    private async Task<DriverProfile> GetDriverForModerationAsync(Guid driverId, CancellationToken cancellationToken)
    {
        var driver = await _dbContext.Drivers
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == driverId, cancellationToken);

        if (driver is null)
        {
            throw new NotFoundException("Driver was not found.");
        }

        return driver;
    }

    private async Task<PendingDriverResponse> GetDriverResponseAsync(Guid driverId, CancellationToken cancellationToken)
    {
        return await _dbContext.Drivers
            .Where(x => x.Id == driverId)
            .Select(MapPendingDriver())
            .FirstAsync(cancellationToken);
    }

    private static Expression<Func<DriverProfile, PendingDriverResponse>> MapPendingDriver()
    {
        return x => new PendingDriverResponse
        {
            Id = x.Id,
            UserId = x.UserId,
            FullName = x.User.FirstName + " " + x.User.LastName,
            Email = x.User.Email,
            Phone = x.User.Phone,
            ZoneId = x.ZoneId,
            ZoneName = x.Zone.Name,
            VehicleType = x.VehicleType.ToString(),
            Plate = x.Plate,
            ApprovalStatus = x.ApprovalStatus.ToString(),
            IsAvailable = x.IsAvailable
        };
    }

    private static Expression<Func<DriverProfile, AdminDriverDetailResponse>> MapAdminDriverDetail()
    {
        return x => new AdminDriverDetailResponse
        {
            DriverId = x.Id,
            UserId = x.UserId,
            FullName = x.User.FirstName + " " + x.User.LastName,
            Email = x.User.Email,
            Phone = x.User.Phone,
            VehicleType = x.VehicleType.ToString(),
            Plate = x.Plate,
            ZoneId = x.ZoneId,
            ZoneName = x.Zone.Name,
            ApprovalStatus = x.ApprovalStatus.ToString(),
            IsAvailable = x.IsAvailable,
            UserStatus = x.User.Status.ToString(),
            IdentityDocumentUrl = x.IdentityDocumentUrl,
            VehiclePhotoUrl = x.VehiclePhotoUrl,
            CreatedAtUtc = x.User.CreatedAtUtc,
            UpdatedAtUtc = x.User.UpdatedAtUtc
        };
    }

    private static string NormalizeAction(string action)
    {
        return action.Trim().ToLowerInvariant();
    }
}
