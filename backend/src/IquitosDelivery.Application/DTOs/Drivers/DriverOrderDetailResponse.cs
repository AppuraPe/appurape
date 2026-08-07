using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.DTOs.Drivers;

public class DriverOrderDetailResponse
{
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }

    public string RestaurantName { get; set; } = string.Empty;

    public string RestaurantAddress { get; set; } = string.Empty;

    public Guid CustomerId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public Guid ZoneId { get; set; }

    public string ZoneName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string DeliveryAddress { get; set; } = string.Empty;

    public string DeliveryReference { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal BusinessCommissionAmount { get; set; }

    public decimal BusinessNetAmount { get; set; }

    public string DeliveryMode { get; set; } = string.Empty;

    public decimal DeliveryFee { get; set; }

    public decimal DeliveryMinimumAmount { get; set; }

    public decimal DeliveryPlatformCommissionAmount { get; set; }

    public decimal CourierEarningAmount { get; set; }

    public decimal ServiceFeeAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal PlatformRevenueAmount { get; set; }

    public decimal Total { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? AcceptedAtUtc { get; set; }

    public DateTime? ReadyAtUtc { get; set; }

    public DateTime? PickedUpAtUtc { get; set; }

    public DateTime? DeliveredAtUtc { get; set; }

    public Guid? AssignedCourierUserId { get; set; }

    public string? AssignedCourierType { get; set; }

    public List<OrderItemDetailResponse> Items { get; set; } = new();
}
