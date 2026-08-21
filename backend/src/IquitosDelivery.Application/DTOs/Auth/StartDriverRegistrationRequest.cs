using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Auth;

public class StartDriverRegistrationRequest
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string IdentityDocumentNumber { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public VehicleType VehicleType { get; set; }

    public string Plate { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string? IdentityDocumentUrl { get; set; }

    public string? VehiclePhotoUrl { get; set; }
}
