using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class Order : BaseEntity
{
    public Guid CustomerId { get; set; }

    public CustomerProfile Customer { get; set; } = null!;

    public Guid RestaurantId { get; set; }

    public Restaurant Restaurant { get; set; } = null!;

    public Guid? DriverId { get; set; }

    public DriverProfile? Driver { get; set; }

    public Guid? AssignedCourierUserId { get; set; }

    public CourierType? AssignedCourierType { get; set; }

    public Guid ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    public OrderStatus Status { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

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

    public string? PricingSnapshotJson { get; set; }

    public string DeliveryAddress { get; set; } = string.Empty;

    public string DeliveryReference { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateTime? AcceptedAtUtc { get; set; }

    public DateTime? ReadyAtUtc { get; set; }

    public DateTime? PickedUpAtUtc { get; set; }

    public DateTime? DeliveredAtUtc { get; set; }

    public int? DriverRating { get; set; }

    public string? DriverFeedback { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public ICollection<OrderIncident> Incidents { get; set; } = new List<OrderIncident>();
}
