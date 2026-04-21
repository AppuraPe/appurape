namespace IquitosDelivery.Application.DTOs.Menu;

public class UpdateMenuCategoryRequest
{
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }
}
