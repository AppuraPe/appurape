using IquitosDelivery.Domain.Common;

namespace IquitosDelivery.Domain.Entities;

public class CustomerAddress : BaseEntity
{
    public Guid CustomerProfileId { get; set; }

    public CustomerProfile CustomerProfile { get; set; } = null!;

    public Guid ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    public string Label { get; set; } = string.Empty;

    public string RecipientName { get; set; } = string.Empty;

    public string RecipientPhone { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; } = true;
}
