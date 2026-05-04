using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Admin;

public class AdminDriverFilterRequest
{
    public string? Q { get; set; }

    public ApprovalStatus? ApprovalStatus { get; set; }

    public bool? IsAvailable { get; set; }

    public UserStatus? Status { get; set; }
}
