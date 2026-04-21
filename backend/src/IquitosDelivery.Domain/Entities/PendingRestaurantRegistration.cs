namespace IquitosDelivery.Domain.Entities;

public class PendingRestaurantRegistration : PendingEmailRegistrationBase
{
    public string RestaurantName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }
}
