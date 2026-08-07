namespace IquitosDelivery.Application.DTOs.Restaurants;

public class UpdateMyRestaurantRequest
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public string? LogoUrl { get; set; }

    public bool HasOwnDelivery { get; set; }

    public decimal? OwnDeliveryFee { get; set; }

    public string? OwnDeliveryNote { get; set; }
}
