using Microsoft.AspNetCore.Http;

namespace IquitosDelivery.Api.Controllers.Requests.Auth;

public class StartRestaurantRegistrationFormRequest
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string RestaurantName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public Guid? BusinessTypeId { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public IFormFile? LogoFile { get; set; }
}
