using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class FinancialMovement : BaseEntity
{
    public Guid? OrderId { get; set; }

    public Order? Order { get; set; }

    public Guid? CommunityRequestId { get; set; }

    public CommunityRequest? CommunityRequest { get; set; }

    public Guid? RestaurantId { get; set; }

    public Restaurant? Restaurant { get; set; }

    public Guid? UserId { get; set; }

    public User? User { get; set; }

    public FinancialMovementType Type { get; set; }

    public FinancialMovementStatus Status { get; set; }

    public decimal Amount { get; set; }

    public string CurrencyCode { get; set; } = "PEN";

    public DateTime OccurredAtUtc { get; set; }

    public DateTime? AvailableAtUtc { get; set; }

    public DateTime? SettledAtUtc { get; set; }

    public string? Reference { get; set; }

    public string? Description { get; set; }
}
