namespace IquitosDelivery.Application.DTOs.Menu;

public class PublicMenuResponse
{
    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public List<PublicMenuCategoryResponse> Categories { get; set; } = new();
}
