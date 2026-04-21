using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminDriverFilterRequest
{
    public ApprovalStatus? ApprovalStatus { get; set; }

    public bool? IsAvailable { get; set; }

    public UserStatus? Status { get; set; }
}
