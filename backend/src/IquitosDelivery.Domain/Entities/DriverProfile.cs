using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class DriverProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public VehicleType VehicleType { get; set; }

    public string Plate { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    public ApprovalStatus ApprovalStatus { get; set; }

    public bool IsAvailable { get; set; }

    public string? IdentityDocumentUrl { get; set; }

    public string? VehiclePhotoUrl { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
