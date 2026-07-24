namespace IquitosDelivery.Application.DTOs.Orders;

public class RejectRestaurantOrderPaymentRequest
{
    public string FailureReason { get; set; } = string.Empty;
}
