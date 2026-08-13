namespace IquitosDelivery.Application.DTOs.Auth;

public class CompleteRestaurantRegistrationRequest
{
    public string Email { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public IReadOnlyList<Guid> AcceptedDocumentIds { get; set; } = [];
    public string? Platform { get; set; }
    public string? AppVersion { get; set; }
}
