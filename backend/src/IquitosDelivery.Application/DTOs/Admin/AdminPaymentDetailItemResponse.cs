namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminPaymentDetailItemResponse
{
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }
}
