namespace IquitosDelivery.Application.DTOs.Orders;

public class RestaurantOrderPaymentResponse
{
    public Guid OrderId { get; set; }

    public Guid PaymentId { get; set; }

    public string Method { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Currency { get; set; } = string.Empty;

    public string? ManualReference { get; set; }

    public DateTime? ConfirmedAtUtc { get; set; }

    public DateTime? RejectedAtUtc { get; set; }

    public string? FailureReason { get; set; }
}
