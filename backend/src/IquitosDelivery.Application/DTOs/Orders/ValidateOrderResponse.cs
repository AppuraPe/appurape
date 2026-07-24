namespace IquitosDelivery.Application.DTOs.Orders;

public class ValidateOrderResponse
{
    public bool CanCreateOrder { get; set; }

    public bool HasChanges { get; set; }

    public decimal Subtotal { get; set; }

    public decimal BusinessCommissionAmount { get; set; }

    public decimal BusinessNetAmount { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal DeliveryPlatformCommissionAmount { get; set; }

    public decimal CourierEarningAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal PlatformRevenueAmount { get; set; }

    public decimal Total { get; set; }

    public List<ValidateOrderItemResponse> Items { get; set; } = new();
}
