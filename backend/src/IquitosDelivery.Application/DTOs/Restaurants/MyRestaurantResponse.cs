namespace IquitosDelivery.Application.DTOs.Restaurants;

public class MyRestaurantResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Reference { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public Guid? BusinessTypeId { get; set; }

    public string? BusinessTypeCode { get; set; }

    public string? BusinessTypeName { get; set; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }

    public string? LogoUrl { get; set; }

    public bool HasOwnDelivery { get; set; }

    public decimal? OwnDeliveryFee { get; set; }

    public string? OwnDeliveryNote { get; set; }

    public bool IsActive { get; set; }

    public string ApprovalStatus { get; set; } = string.Empty;

    public Guid OwnerUserId { get; set; }
}
