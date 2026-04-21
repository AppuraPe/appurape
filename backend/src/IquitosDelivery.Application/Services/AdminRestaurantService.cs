using System.Linq.Expressions;
using FluentValidation;
using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class AdminRestaurantService : IAdminRestaurantService
{
    private readonly IAppDbContext _dbContext;
    private readonly IValidator<UpdateAdminEntityStatusRequest> _statusValidator;

    public AdminRestaurantService(IAppDbContext dbContext, IValidator<UpdateAdminEntityStatusRequest> statusValidator)
    {
        _dbContext = dbContext;
        _statusValidator = statusValidator;
    }

    public async Task<IReadOnlyList<AdminRestaurantListItemResponse>> GetRestaurantsAsync(
        AdminRestaurantFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Restaurants.AsQueryable();

        if (filters.ApprovalStatus.HasValue)
        {
            query = query.Where(x => x.ApprovalStatus == filters.ApprovalStatus.Value);
        }

        if (filters.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == filters.IsActive.Value);
        }

        if (filters.Status.HasValue)
        {
            query = query.Where(x => x.OwnerUser.Status == filters.Status.Value);
        }

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new AdminRestaurantListItemResponse
            {
                RestaurantId = x.Id,
                OwnerUserId = x.OwnerUserId,
                OwnerFullName = x.OwnerUser.FirstName + " " + x.OwnerUser.LastName,
                OwnerEmail = x.OwnerUser.Email,
                Name = x.Name,
                Address = x.Address,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                ApprovalStatus = x.ApprovalStatus.ToString(),
                IsActive = x.IsActive,
                UserStatus = x.OwnerUser.Status.ToString(),
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminRestaurantDetailResponse> GetRestaurantByIdAsync(Guid restaurantId, CancellationToken cancellationToken = default)
    {
        var restaurant = await _dbContext.Restaurants
            .Where(x => x.Id == restaurantId)
            .Select(MapAdminRestaurantDetail())
            .FirstOrDefaultAsync(cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("Restaurant was not found.");
        }

        return restaurant;
    }

    public async Task<AdminRestaurantDetailResponse> UpdateRestaurantStatusAsync(
        Guid restaurantId,
        UpdateAdminEntityStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _statusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetRestaurantForModerationAsync(restaurantId, cancellationToken);
        ApplyRestaurantAction(restaurant, NormalizeAction(request.Action));

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetRestaurantByIdAsync(restaurantId, cancellationToken);
    }

    public async Task<IReadOnlyList<PendingRestaurantResponse>> GetPendingRestaurantsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Restaurants
            .Where(x => x.ApprovalStatus == ApprovalStatus.Pending)
            .OrderBy(x => x.CreatedAtUtc)
            .Select(x => new PendingRestaurantResponse
            {
                Id = x.Id,
                Name = x.Name,
                OwnerUserId = x.OwnerUserId,
                OwnerFullName = x.OwnerUser.FirstName + " " + x.OwnerUser.LastName,
                Email = x.OwnerUser.Email,
                Phone = x.OwnerUser.Phone,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                ApprovalStatus = x.ApprovalStatus.ToString(),
                IsActive = x.IsActive,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<PendingRestaurantResponse> ApproveRestaurantAsync(Guid restaurantId, CancellationToken cancellationToken = default)
    {
        var restaurant = await GetRestaurantForModerationAsync(restaurantId, cancellationToken);

        restaurant.ApprovalStatus = ApprovalStatus.Approved;
        restaurant.IsActive = true;
        restaurant.OwnerUser.Status = UserStatus.Active;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await MapPendingRestaurantAsync(restaurantId, cancellationToken);
    }

    private static void ApplyRestaurantAction(Restaurant restaurant, string action)
    {
        switch (action)
        {
            case "approve":
                restaurant.OwnerUser.Status = UserStatus.Active;
                restaurant.ApprovalStatus = ApprovalStatus.Approved;
                restaurant.IsActive = true;
                break;
            case "reject":
                restaurant.OwnerUser.Status = UserStatus.Pending;
                restaurant.ApprovalStatus = ApprovalStatus.Rejected;
                restaurant.IsActive = false;
                break;
            case "suspend":
                restaurant.OwnerUser.Status = UserStatus.Suspended;
                restaurant.IsActive = false;
                break;
            case "reactivate":
                if (restaurant.ApprovalStatus != ApprovalStatus.Approved)
                {
                    throw new AppException("Only approved restaurants can be reactivated.");
                }

                restaurant.OwnerUser.Status = UserStatus.Active;
                restaurant.IsActive = true;
                break;
            default:
                throw new AppException("Invalid admin action.");
        }
    }

    public async Task<PendingRestaurantResponse> RejectRestaurantAsync(Guid restaurantId, CancellationToken cancellationToken = default)
    {
        var restaurant = await GetRestaurantForModerationAsync(restaurantId, cancellationToken);

        restaurant.ApprovalStatus = ApprovalStatus.Rejected;
        restaurant.IsActive = false;
        restaurant.OwnerUser.Status = UserStatus.Pending;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await MapPendingRestaurantAsync(restaurantId, cancellationToken);
    }

    private async Task<Domain.Entities.Restaurant> GetRestaurantForModerationAsync(Guid restaurantId, CancellationToken cancellationToken)
    {
        var restaurant = await _dbContext.Restaurants
            .Include(x => x.OwnerUser)
            .FirstOrDefaultAsync(x => x.Id == restaurantId, cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("Restaurant was not found.");
        }

        return restaurant;
    }

    private async Task<PendingRestaurantResponse> MapPendingRestaurantAsync(Guid restaurantId, CancellationToken cancellationToken)
    {
        return await _dbContext.Restaurants
            .Where(x => x.Id == restaurantId)
            .Select(x => new PendingRestaurantResponse
            {
                Id = x.Id,
                Name = x.Name,
                OwnerUserId = x.OwnerUserId,
                OwnerFullName = x.OwnerUser.FirstName + " " + x.OwnerUser.LastName,
                Email = x.OwnerUser.Email,
                Phone = x.OwnerUser.Phone,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                ApprovalStatus = x.ApprovalStatus.ToString(),
                IsActive = x.IsActive,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .FirstAsync(cancellationToken);
    }

    private static Expression<Func<Restaurant, AdminRestaurantDetailResponse>> MapAdminRestaurantDetail()
    {
        return x => new AdminRestaurantDetailResponse
        {
            RestaurantId = x.Id,
            OwnerUserId = x.OwnerUserId,
            OwnerFullName = x.OwnerUser.FirstName + " " + x.OwnerUser.LastName,
            OwnerEmail = x.OwnerUser.Email,
            OwnerPhone = x.OwnerUser.Phone,
            Name = x.Name,
            Description = x.Description,
            Address = x.Address,
            Reference = x.Reference,
            ZoneId = x.ZoneId,
            ZoneName = x.Zone.Name,
            ApprovalStatus = x.ApprovalStatus.ToString(),
            IsActive = x.IsActive,
            UserStatus = x.OwnerUser.Status.ToString(),
            OpenTime = x.OpenTime,
            CloseTime = x.CloseTime,
            LogoUrl = x.LogoUrl,
            CreatedAtUtc = x.CreatedAtUtc,
            UpdatedAtUtc = x.UpdatedAtUtc
        };
    }

    private static string NormalizeAction(string action)
    {
        return action.Trim().ToLowerInvariant();
    }
}
