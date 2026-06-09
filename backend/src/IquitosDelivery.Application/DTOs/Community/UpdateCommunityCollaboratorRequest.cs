using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.DTOs.Community;

public class UpdateCommunityCollaboratorRequest
{
    public bool IsAvailable { get; set; }

    public CommunityAvailabilityStatus AvailabilityStatus { get; set; }

    public decimal? CurrentLatitude { get; set; }

    public decimal? CurrentLongitude { get; set; }

    public decimal AvailabilityRadiusKm { get; set; }

    public DateTime? AvailableFromUtc { get; set; }

    public DateTime? AvailableUntilUtc { get; set; }
}
