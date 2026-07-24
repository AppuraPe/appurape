namespace IquitosDelivery.Application.DTOs.CustomerAddresses;

public class UpsertCustomerAddressRequest
{
    public string Label { get; set; } = string.Empty;

    public string RecipientName { get; set; } = string.Empty;

    public string RecipientPhone { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }
}
