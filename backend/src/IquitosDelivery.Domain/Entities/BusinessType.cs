namespace IquitosDelivery.Domain.Entities;

public class BusinessType
{
    public Guid Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? IconKey { get; set; }

    public int SortOrder { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();

    public ICollection<PendingRestaurantRegistration> PendingRestaurantRegistrations { get; set; } = new List<PendingRestaurantRegistration>();
}
