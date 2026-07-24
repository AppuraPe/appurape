using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }

    public Order Order { get; set; } = null!;

    public PaymentMethod Method { get; set; }

    public PaymentStatus Status { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "PEN";

    public string? Provider { get; set; }

    public string? ExternalReference { get; set; }

    public string? ManualReference { get; set; }

    public Guid? ConfirmedByUserId { get; set; }

    public User? ConfirmedByUser { get; set; }

    public DateTime? PaidAtUtc { get; set; }

    public DateTime? ConfirmedAtUtc { get; set; }

    public DateTime? RejectedAtUtc { get; set; }

    public string? FailureReason { get; set; }
}
