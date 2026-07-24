namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminPaymentDetailResponse
{
    public Guid OrderId { get; set; }

    public string OrderCode { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string? CustomerPhone { get; set; }

    public string BusinessName { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public string OrderStatus { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal Total { get; set; }

    public string? PaymentReference { get; set; }

    public string? PaymentProofUrl { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public List<AdminPaymentDetailItemResponse> Items { get; set; } = new();
}
