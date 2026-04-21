namespace IquitosDelivery.Application.DTOs.Menu;

public class CreateMenuCategoryRequest
{
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }
}
