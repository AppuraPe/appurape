namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminRestaurantListItemResponse
{
    public Guid RestaurantId { get; set; }

    public Guid OwnerUserId { get; set; }

    public string OwnerFullName { get; set; } = string.Empty;

    public string OwnerEmail { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public string ApprovalStatus { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public string UserStatus { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
}
