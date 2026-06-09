using Microsoft.AspNetCore.Http;

namespace IquitosDelivery.Api.Controllers.Requests.Menu;

public class CreateMenuItemFormRequest
{
    public Guid CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string? Sku { get; set; }

    public string? UnitLabel { get; set; }

    public bool TrackStock { get; set; }

    public int? StockQuantity { get; set; }

    public IFormFile? ImageFile { get; set; }
}
