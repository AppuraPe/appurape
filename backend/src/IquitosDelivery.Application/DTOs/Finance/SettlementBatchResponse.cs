namespace IquitosDelivery.Application.DTOs.Finance;

public class SettlementBatchResponse
{
    public Guid Id { get; set; }

    public string TargetType { get; set; } = string.Empty;

    public Guid? BusinessId { get; set; }

    public string? BusinessName { get; set; }

    public Guid? DriverId { get; set; }

    public Guid? CollaboratorUserId { get; set; }

    public string? CollaboratorName { get; set; }

    public DateTime PeriodStartUtc { get; set; }

    public DateTime PeriodEndUtc { get; set; }

    public decimal GrossAmount { get; set; }

    public decimal CommissionAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal NetAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ConfirmedAtUtc { get; set; }

    public string? Notes { get; set; }

    public List<SettlementItemResponse> Items { get; set; } = new();
}
