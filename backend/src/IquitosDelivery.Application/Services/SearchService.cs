using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Search;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class SearchService : ISearchService
{
    private readonly IAppDbContext _dbContext;

    public SearchService(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PublicSearchResponse> SearchPublicAsync(string? query, CancellationToken cancellationToken = default)
    {
        var rawQuery = query?.Trim() ?? string.Empty;
        var searchTerm = SearchQuery.Normalize(query);
        if (searchTerm is null)
        {
            return new PublicSearchResponse
            {
                Query = string.Empty
            };
        }

        var foodsQuery = _dbContext.MenuItems
            .Where(x =>
                x.IsActive &&
                x.IsAvailable &&
                x.Category.IsActive &&
                x.Restaurant.ApprovalStatus == ApprovalStatus.Approved &&
                x.Restaurant.IsActive &&
                (x.Name.ToLower().Contains(searchTerm) ||
                 x.Description.ToLower().Contains(searchTerm) ||
                 x.Category.Name.ToLower().Contains(searchTerm) ||
                 x.Restaurant.Name.ToLower().Contains(searchTerm)));

        var restaurantsQuery = _dbContext.Restaurants
            .Where(x =>
                x.ApprovalStatus == ApprovalStatus.Approved &&
                x.IsActive &&
                (x.Name.ToLower().Contains(searchTerm) ||
                 x.Description.ToLower().Contains(searchTerm) ||
                 x.Zone.Name.ToLower().Contains(searchTerm) ||
                 x.MenuItems.Any(item =>
                     item.IsActive &&
                     item.IsAvailable &&
                     item.Category.IsActive &&
                     (item.Name.ToLower().Contains(searchTerm) ||
                      item.Description.ToLower().Contains(searchTerm)))));

        var foods = await foodsQuery
            .OrderBy(x =>
                x.Name.ToLower().Contains(searchTerm) ? 0 :
                x.Category.Name.ToLower().Contains(searchTerm) ? 1 :
                x.Description.ToLower().Contains(searchTerm) ? 2 : 3)
            .ThenBy(x => x.Restaurant.Name)
            .ThenBy(x => x.Name)
            .Select(x => new PublicSearchFoodItemResponse
            {
                MenuItemId = x.Id,
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant.Name,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Name = x.Name,
                Description = x.Description,
                Price = x.Price,
                ImageUrl = x.ImageUrl,
                ZoneId = x.Restaurant.ZoneId,
                ZoneName = x.Restaurant.Zone.Name
            })
            .ToListAsync(cancellationToken);

        var restaurants = await restaurantsQuery
            .OrderBy(x =>
                x.Name.ToLower().Contains(searchTerm) ? 0 :
                x.Description.ToLower().Contains(searchTerm) ? 1 :
                x.MenuItems.Any(item =>
                    item.IsActive &&
                    item.IsAvailable &&
                    item.Category.IsActive &&
                    item.Name.ToLower().Contains(searchTerm)) ? 2 : 3)
            .ThenBy(x => x.Name)
            .Select(x => new PublicSearchRestaurantItemResponse
            {
                RestaurantId = x.Id,
                Name = x.Name,
                Description = x.Description,
                ZoneId = x.ZoneId,
                ZoneName = x.Zone.Name,
                OpenTime = x.OpenTime,
                CloseTime = x.CloseTime,
                LogoUrl = x.LogoUrl
            })
            .ToListAsync(cancellationToken);

        return new PublicSearchResponse
        {
            Query = rawQuery,
            Foods = foods,
            Restaurants = restaurants
        };
    }
}
