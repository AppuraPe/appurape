namespace IquitosDelivery.Application.DTOs.Orders;

public class OrderDeliveryConfirmationResponse
{
    public Guid OrderId { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public int RemainingAttempts { get; set; }
    public bool CanRegenerate { get; set; }
    public bool IsLocked { get; set; }
}

public class ConfirmOrderDeliveryRequest
{
    public string ConfirmationCode { get; set; } = string.Empty;
}

public class AdminRegenerateOrderDeliveryCodeRequest
{
    public string Reason { get; set; } = string.Empty;
}
