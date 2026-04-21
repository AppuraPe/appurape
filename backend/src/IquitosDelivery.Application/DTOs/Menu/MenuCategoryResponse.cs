namespace IquitosDelivery.Application.DTOs.Menu;

public class MenuCategoryResponse
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }
}
