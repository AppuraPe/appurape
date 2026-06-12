namespace IquitosDelivery.Application.DTOs.Restaurants;

public class RestaurantListItemResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public Guid? BusinessTypeId { get; set; }

    public string? BusinessTypeCode { get; set; }

    public string? BusinessTypeName { get; set; }

    public string? BusinessTypeSlug { get; set; }

    public string? BusinessTypeIconKey { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public string? LogoUrl { get; set; }

    public bool IsOpenNow { get; set; }
}
