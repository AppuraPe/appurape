namespace IquitosDelivery.Application.DTOs.Zones;

public class ZoneResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal DeliveryFee { get; set; }

    public bool IsActive { get; set; }
}
