using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class PendingDriverRegistration : PendingEmailRegistrationBase
{
    public VehicleType VehicleType { get; set; }

    public string Plate { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string? IdentityDocumentUrl { get; set; }

    public string? VehiclePhotoUrl { get; set; }
}
