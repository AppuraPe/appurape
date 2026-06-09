namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminDriverDetailResponse
{
    public Guid DriverId { get; set; }

    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string VehicleType { get; set; } = string.Empty;

    public string Plate { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public string ApprovalStatus { get; set; } = string.Empty;

    public bool IsAvailable { get; set; }

    public string TrustLevel { get; set; } = string.Empty;

    public int CompletedDeliveriesCount { get; set; }

    public decimal TrustScore { get; set; }

    public decimal AverageRating { get; set; }

    public string UserStatus { get; set; } = string.Empty;

    public string? IdentityDocumentUrl { get; set; }

    public string? VehiclePhotoUrl { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}
