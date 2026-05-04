namespace IquitosDelivery.Application.DTOs.Search;

public class PublicSearchFoodItemResponse
{
    public Guid MenuItemId { get; set; }

    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;
}
