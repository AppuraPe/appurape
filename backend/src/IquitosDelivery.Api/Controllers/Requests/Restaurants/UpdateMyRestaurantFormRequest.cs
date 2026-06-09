using Microsoft.AspNetCore.Http;

namespace IquitosDelivery.Api.Controllers.Requests.Restaurants;

public class UpdateMyRestaurantFormRequest
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public string? LogoUrl { get; set; }

    public IFormFile? LogoFile { get; set; }
}
