namespace IquitosDelivery.Application.DTOs.Menu;

public class PublicMenuCategoryResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public List<MenuItemResponse> Items { get; set; } = new();
}
