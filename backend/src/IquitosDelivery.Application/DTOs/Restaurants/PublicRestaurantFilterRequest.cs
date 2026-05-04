namespace IquitosDelivery.Application.DTOs.Restaurants;

public class PublicRestaurantFilterRequest
{
    public string? Q { get; set; }

    public Guid? ZoneId { get; set; }
}
