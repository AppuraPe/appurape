namespace IquitosDelivery.Application.DTOs.Orders;

public class CustomerOrderListItemResponse
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal BusinessCommissionAmount { get; set; }

    public decimal BusinessNetAmount { get; set; }

    public decimal DeliveryPlatformCommissionAmount { get; set; }

    public decimal CourierEarningAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal PlatformRevenueAmount { get; set; }

    public decimal Total { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public Guid? AssignedCourierUserId { get; set; }

    public string? AssignedCourierType { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
