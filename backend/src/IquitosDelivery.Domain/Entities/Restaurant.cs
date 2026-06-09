using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class Restaurant : BaseEntity
{
    public Guid OwnerUserId { get; set; }

    public User OwnerUser { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    public Guid? BusinessTypeId { get; set; }

    public BusinessType? BusinessType { get; set; }

    public ApprovalStatus ApprovalStatus { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; }

    public ICollection<MenuCategory> Categories { get; set; } = new List<MenuCategory>();

    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
