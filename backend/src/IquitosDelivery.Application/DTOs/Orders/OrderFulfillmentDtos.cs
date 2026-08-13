namespace IquitosDelivery.Application.DTOs.Orders;

public class OrderFulfillmentOptionsResponse
{
    public Guid OrderId { get; set; }
    public string CurrentDeliveryMode { get; set; } = string.Empty;
    public bool CanRequestDriver { get; set; }
    public bool CanRequestCollaborator { get; set; }
    public string? UnavailableReason { get; set; }
    public Guid? LinkedCommunityRequestId { get; set; }
}

public class OrderCollaboratorPickupQuoteRequest
{
    public decimal CompensationAmount { get; set; }
    public DateTime? DeadlineUtc { get; set; }
    public Guid? CustomerAddressId { get; set; }
    public Guid? ZoneId { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryReference { get; set; }
}

public class OrderCollaboratorPickupQuoteResponse
{
    public Guid OrderId { get; set; }
    public decimal CollaboratorEarningAmount { get; set; }
    public decimal TotalAdditionalAmount { get; set; }
    public DateTime DeadlineUtc { get; set; }
    public DateTime QuoteExpiresAtUtc { get; set; }
    public string QuoteToken { get; set; } = string.Empty;
}

public class CreateOrderCollaboratorPickupRequest
{
    public string QuoteToken { get; set; } = string.Empty;
}

public class OrderCollaboratorPickupResponse
{
    public Guid OrderId { get; set; }
    public Guid CommunityRequestId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAdditionalAmount { get; set; }
}

public class ConfirmCollaboratorPickupRequest
{
    public string PickupCode { get; set; } = string.Empty;
}

public class RequestOrderDriverDeliveryRequest
{
    public decimal? OfferedDeliveryAmount { get; set; }
    public Guid? CustomerAddressId { get; set; }
    public Guid? ZoneId { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryReference { get; set; }
}

public class OrderDriverDeliveryResponse
{
    public Guid OrderId { get; set; }
    public string DeliveryMode { get; set; } = string.Empty;
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
}
