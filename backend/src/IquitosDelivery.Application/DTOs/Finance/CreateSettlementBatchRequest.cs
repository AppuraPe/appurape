using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Finance;

public class CreateSettlementBatchRequest
{
    public SettlementTargetType TargetType { get; set; }

    public Guid? BusinessId { get; set; }

    public Guid? DriverId { get; set; }

    public Guid? CollaboratorUserId { get; set; }

    public DateTime PeriodStartUtc { get; set; }

    public DateTime PeriodEndUtc { get; set; }

    public List<Guid> FinancialMovementIds { get; set; } = new();

    public List<Guid> FinancialObligationIds { get; set; } = new();

    public string? Notes { get; set; }
}
