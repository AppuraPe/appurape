namespace IquitosDelivery.Application.DTOs.Orders;

public class RestaurantOrderListItemResponse
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public int ItemCount { get; set; }

    public string Status { get; set; } = string.Empty;

    public decimal BusinessNetAmount { get; set; }

    public string DeliveryMode { get; set; } = string.Empty;

    public decimal DeliveryFee { get; set; }

    public decimal DeliveryMinimumAmount { get; set; }

    public decimal PlatformRevenueAmount { get; set; }

    public decimal Total { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public Guid? AssignedCourierUserId { get; set; }

    public string? AssignedCourierType { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
