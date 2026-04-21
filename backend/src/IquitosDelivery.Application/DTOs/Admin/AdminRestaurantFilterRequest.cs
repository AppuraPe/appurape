using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminRestaurantFilterRequest
{
    public ApprovalStatus? ApprovalStatus { get; set; }

    public bool? IsActive { get; set; }

    public UserStatus? Status { get; set; }
}
