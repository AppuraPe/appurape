namespace IquitosDelivery.Domain.Entities;

public class CustomerAddress
{
    public Guid Id { get; set; }

    public Guid CustomerProfileId { get; set; }

    public CustomerProfile CustomerProfile { get; set; } = null!;

    public Guid ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    public string AddressLine { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool IsDefault { get; set; }
}
