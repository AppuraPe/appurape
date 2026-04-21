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

    public bool IsAvailable { get; set; }

    public bool IsActive { get; set; }
}
