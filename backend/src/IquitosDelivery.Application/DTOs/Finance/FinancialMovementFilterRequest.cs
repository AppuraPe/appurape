using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Finance;

public class FinancialMovementFilterRequest
{
    public Guid? OrderId { get; set; }

    public Guid? CommunityRequestId { get; set; }

    public Guid? RestaurantId { get; set; }

    public Guid? UserId { get; set; }

    public FinancialMovementType? Type { get; set; }

    public FinancialMovementStatus? Status { get; set; }
}
