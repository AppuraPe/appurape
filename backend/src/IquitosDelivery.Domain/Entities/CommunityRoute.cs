namespace IquitosDelivery.Domain.Entities;

public class CommunityRoute
{
    public Guid Id { get; set; }

    public Guid CommunityCollaboratorId { get; set; }

    public CommunityCollaborator CommunityCollaborator { get; set; } = null!;

    public string OriginLabel { get; set; } = string.Empty;

    public decimal OriginLatitude { get; set; }

    public decimal OriginLongitude { get; set; }

    public string DestinationLabel { get; set; } = string.Empty;

    public decimal DestinationLatitude { get; set; }

    public decimal DestinationLongitude { get; set; }

    public int EstimatedMinutes { get; set; }

    public decimal DeviationRadiusKm { get; set; }

    public bool IsActive { get; set; }

    public DateTime? StartsAtUtc { get; set; }

    public DateTime? EndsAtUtc { get; set; }
}
