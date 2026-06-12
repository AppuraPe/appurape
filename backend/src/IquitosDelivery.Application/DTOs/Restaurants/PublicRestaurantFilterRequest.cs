namespace IquitosDelivery.Application.DTOs.Restaurants;

public class PublicRestaurantFilterRequest
{
    public string? Q { get; set; }

    public Guid? ZoneId { get; set; }

    public Guid? BusinessTypeId { get; set; }

    public bool? OpenNow { get; set; }

    public string? Sort { get; set; }

    public int? Page { get; set; }

    public int? PageSize { get; set; }
}
