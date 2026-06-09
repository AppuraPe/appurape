using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class CommunityRequestApplication : BaseEntity
{
    public Guid CommunityRequestId { get; set; }

    public CommunityRequest CommunityRequest { get; set; } = null!;

    public Guid CollaboratorId { get; set; }

    public CommunityCollaborator Collaborator { get; set; } = null!;

    public Guid? RouteId { get; set; }

    public CommunityRoute? Route { get; set; }

    public decimal MatchScore { get; set; }

    public decimal DistanceKm { get; set; }

    public int EstimatedMinutes { get; set; }

    public bool HasRouteMatch { get; set; }

    public CommunityRequestApplicationStatus Status { get; set; }

    public DateTime AppliedAtUtc { get; set; }

    public DateTime? ReviewedAtUtc { get; set; }
}
