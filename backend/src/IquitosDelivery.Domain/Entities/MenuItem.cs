namespace IquitosDelivery.Domain.Entities;

public class MenuItem
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public Restaurant Restaurant { get; set; } = null!;

    public Guid CategoryId { get; set; }

    public MenuCategory Category { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    public string? Sku { get; set; }

    public string? UnitLabel { get; set; }

    public bool TrackStock { get; set; }

    public int? StockQuantity { get; set; }

    public bool IsAvailable { get; set; }

    public bool IsActive { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
