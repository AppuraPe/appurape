namespace IquitosDelivery.Application.DTOs.Menu;

public class CreateMenuItemRequest
{
    public Guid CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    public string? Sku { get; set; }

    public string? UnitLabel { get; set; }

    public bool TrackStock { get; set; }

    public int? StockQuantity { get; set; }
}
