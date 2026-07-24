namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminPaymentListItemResponse
{
    public Guid OrderId { get; set; }

    public string OrderCode { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string BusinessName { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public string OrderStatus { get; set; } = string.Empty;

    public decimal Total { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
