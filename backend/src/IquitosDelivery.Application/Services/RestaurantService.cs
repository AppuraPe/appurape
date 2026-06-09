using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class RestaurantService : IRestaurantService
{
    private const string LegacyRestaurantBusinessTypeCode = "Restaurant";
    private const string LegacyRestaurantBusinessTypeName = "Restaurant";
    private const string LimaWindowsTimeZoneId = "SA Pacific Standard Time";
    private const string LimaIanaTimeZoneId = "America/Lima";

    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<UpdateMyRestaurantRequest> _updateValidator;

    public RestaurantService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IValidator<UpdateMyRestaurantRequest> updateValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<RestaurantListItemResponse>> GetPublicRestaurantsAsync(
        PublicRestaurantFilterRequest filters,
        CancellationToken cancellationToken = default)
    {
        var searchTerm = SearchQuery.Normalize(filters.Q);
        var query = _dbContext.Restaurants
            .Where(x => x.ApprovalStatus == ApprovalStatus.Approved && x.IsActive);

        if (filters.ZoneId.HasValue)
        {
            query = query.Where(x => x.ZoneId == filters.ZoneId.Value);
        }

        if (searchTerm is not null)
        {
            query = query.Where(x =>
                x.Name.ToLower().Contains(searchTerm) ||
                x.Description.ToLower().Contains(searchTerm) ||
                x.Zone.Name.ToLower().Contains(searchTerm));
        }

        var restaurants = await query
            .OrderBy(x => x.Name)
            .Select(x => new RestaurantListItemResponse
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Address = x.Address,
                Reference = x.Reference,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                BusinessTypeId = x.BusinessTypeId,
                BusinessTypeCode = x.BusinessType != null ? x.BusinessType.Code : LegacyRestaurantBusinessTypeCode,
                BusinessTypeName = x.BusinessType != null ? x.BusinessType.Name : LegacyRestaurantBusinessTypeName,
                OpenTime = x.OpenTime,
                CloseTime = x.CloseTime,
                LogoUrl = x.LogoUrl
            })
            .ToListAsync(cancellationToken);

        foreach (var restaurant in restaurants)
        {
            restaurant.IsOpenNow = IsRestaurantOpen(restaurant.OpenTime, restaurant.CloseTime, true);
        }

        return restaurants;
    }

    public async Task<RestaurantDetailResponse> GetPublicRestaurantDetailAsync(Guid restaurantId, CancellationToken cancellationToken = default)
    {
        var restaurant = await _dbContext.Restaurants
            .Where(x => x.Id == restaurantId && x.ApprovalStatus == ApprovalStatus.Approved && x.IsActive)
            .Select(x => new RestaurantDetailResponse
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Address = x.Address,
                Reference = x.Reference,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                BusinessTypeId = x.BusinessTypeId,
                BusinessTypeCode = x.BusinessType != null ? x.BusinessType.Code : LegacyRestaurantBusinessTypeCode,
                BusinessTypeName = x.BusinessType != null ? x.BusinessType.Name : LegacyRestaurantBusinessTypeName,
                OpenTime = x.OpenTime,
                CloseTime = x.CloseTime,
                LogoUrl = x.LogoUrl,
                IsActive = x.IsActive,
                ApprovalStatus = x.ApprovalStatus.ToString()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("Restaurant is not available.");
        }

        return restaurant;
    }

    public async Task<MyRestaurantResponse> GetMyRestaurantAsync(CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        return MapMyRestaurant(restaurant);
    }

    public async Task<MyRestaurantResponse> UpdateMyRestaurantAsync(UpdateMyRestaurantRequest request, CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);
        var zoneExists = await _dbContext.Zones.AnyAsync(x => x.Id == request.ZoneId && x.IsActive, cancellationToken);

        if (!zoneExists)
        {
            throw new NotFoundException("The selected zone was not found.");
        }

        restaurant.Name = request.Name.Trim();
        restaurant.Description = request.Description.Trim();
        restaurant.Address = request.Address.Trim();
        restaurant.Reference = request.Reference.Trim();
        restaurant.ZoneId = request.ZoneId;
        restaurant.OpenTime = request.OpenTime;
        restaurant.CloseTime = request.CloseTime;
        restaurant.LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        return MapMyRestaurant(restaurant);
    }

    public async Task<MyRestaurantResponse> UpdateMyRestaurantActivationAsync(UpdateRestaurantActivationRequest request, CancellationToken cancellationToken = default)
    {
        var restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        if (request.IsActive && restaurant.ApprovalStatus != ApprovalStatus.Approved)
        {
            throw new AppException("Restaurant cannot be activated until it is approved.");
        }

        restaurant.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);
        restaurant = await GetCurrentRestaurantAsync(cancellationToken);

        return MapMyRestaurant(restaurant);
    }

    private async Task<Restaurant> GetCurrentRestaurantAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var restaurant = await _dbContext.Restaurants
            .Include(x => x.Zone)
            .Include(x => x.BusinessType)
            .FirstOrDefaultAsync(x => x.OwnerUserId == _currentUserService.UserId.Value, cancellationToken);

        if (restaurant is null)
        {
            throw new NotFoundException("No restaurant is associated with the authenticated user.");
        }

        return restaurant;
    }

    private static MyRestaurantResponse MapMyRestaurant(Restaurant restaurant)
    {
        return new MyRestaurantResponse
        {
            Id = restaurant.Id,
            Name = restaurant.Name,
            Description = restaurant.Description,
            Address = restaurant.Address,
            Reference = restaurant.Reference,
            ZoneId = restaurant.ZoneId,
            ZoneName = restaurant.Zone.Name,
            BusinessTypeId = restaurant.BusinessTypeId,
            BusinessTypeCode = restaurant.BusinessType?.Code ?? LegacyRestaurantBusinessTypeCode,
            BusinessTypeName = restaurant.BusinessType?.Name ?? LegacyRestaurantBusinessTypeName,
            OpenTime = restaurant.OpenTime,
            CloseTime = restaurant.CloseTime,
            LogoUrl = restaurant.LogoUrl,
            IsActive = restaurant.IsActive,
            ApprovalStatus = restaurant.ApprovalStatus.ToString(),
            OwnerUserId = restaurant.OwnerUserId
        };
    }

    private static bool IsRestaurantOpen(TimeSpan openTime, TimeSpan closeTime, bool isActive)
    {
        if (!isActive)
        {
            return false;
        }

        var now = GetLimaNow().TimeOfDay;

        if (closeTime >= openTime)
        {
            return now >= openTime && now <= closeTime;
        }

        return now >= openTime || now <= closeTime;
    }

    private static DateTime GetLimaNow()
    {
        try
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(LimaWindowsTimeZoneId);
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                var timeZone = TimeZoneInfo.FindSystemTimeZoneById(LimaIanaTimeZoneId);
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
            }
            catch
            {
                return DateTime.UtcNow;
            }
        }
    }
}
