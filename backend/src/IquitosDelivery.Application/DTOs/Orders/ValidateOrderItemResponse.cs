namespace IquitosDelivery.Application.DTOs.Orders;

public class ValidateOrderItemResponse
{
    public Guid MenuItemId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public int RequestedQuantity { get; set; }

    public int ValidatedQuantity { get; set; }

    public decimal? ClientUnitPrice { get; set; }

    public decimal CurrentUnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    public bool Exists { get; set; }

    public bool BelongsToRestaurant { get; set; }

    public bool IsActive { get; set; }

    public bool IsAvailable { get; set; }

    public bool HasStock { get; set; }

    public bool QuantityAdjusted { get; set; }

    public bool PriceChanged { get; set; }

    public bool Removed { get; set; }

    public string Message { get; set; } = string.Empty;
}
