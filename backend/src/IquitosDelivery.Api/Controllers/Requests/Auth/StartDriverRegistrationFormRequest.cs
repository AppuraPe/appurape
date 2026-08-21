using Microsoft.AspNetCore.Http;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Api.Controllers.Requests.Auth;

public class StartDriverRegistrationFormRequest
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string IdentityDocumentNumber { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public VehicleType VehicleType { get; set; }

    public string Plate { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public IFormFile? IdentityDocumentFile { get; set; }

    public IFormFile? VehiclePhotoFile { get; set; }
}
