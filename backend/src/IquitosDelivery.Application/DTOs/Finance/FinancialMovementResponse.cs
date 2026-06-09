namespace IquitosDelivery.Application.DTOs.Finance;

public class FinancialMovementResponse
{
    public Guid Id { get; set; }

    public Guid? OrderId { get; set; }

    public Guid? CommunityRequestId { get; set; }

    public Guid? RestaurantId { get; set; }

    public string? RestaurantName { get; set; }

    public Guid? UserId { get; set; }

    public string? UserFullName { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string CurrencyCode { get; set; } = string.Empty;

    public DateTime OccurredAtUtc { get; set; }

    public DateTime? AvailableAtUtc { get; set; }

    public DateTime? SettledAtUtc { get; set; }

    public string? Reference { get; set; }

    public string? Description { get; set; }
}
