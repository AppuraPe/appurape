namespace IquitosDelivery.Domain.Entities;

public class CustomerProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
