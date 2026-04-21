namespace IquitosDelivery.Domain.Entities;

public class Zone
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal DeliveryFee { get; set; }

    public bool IsActive { get; set; }

    public ICollection<CustomerAddress> CustomerAddresses { get; set; } = new List<CustomerAddress>();

    public ICollection<DriverProfile> Drivers { get; set; } = new List<DriverProfile>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
}
