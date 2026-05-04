namespace IquitosDelivery.Application.DTOs.Menu;

public class MenuItemFilterRequest
{
    public string? Q { get; set; }

    public Guid? CategoryId { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsAvailable { get; set; }
}
