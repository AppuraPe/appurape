namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminRestaurantDetailResponse
{
    public Guid RestaurantId { get; set; }

    public Guid OwnerUserId { get; set; }

    public string OwnerFullName { get; set; } = string.Empty;

    public string OwnerEmail { get; set; } = string.Empty;

    public string OwnerPhone { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public Guid? BusinessTypeId { get; set; }

    public string? BusinessTypeCode { get; set; }

    public string? BusinessTypeName { get; set; }

    public string ApprovalStatus { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public string UserStatus { get; set; } = string.Empty;

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public string? LogoUrl { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}
