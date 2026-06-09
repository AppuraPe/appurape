namespace IquitosDelivery.Application.DTOs.Menu;

public class MenuItemResponse
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    public string? Sku { get; set; }

    public string? UnitLabel { get; set; }

    public bool TrackStock { get; set; }

    public int? StockQuantity { get; set; }

    public bool HasStock { get; set; }

    public bool IsAvailable { get; set; }

    public bool IsActive { get; set; }
}
