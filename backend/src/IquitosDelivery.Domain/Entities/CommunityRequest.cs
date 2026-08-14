using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class CommunityRequest : BaseEntity
{
    public Guid? OrderId { get; set; }

    public Order? Order { get; set; }

    public CommunityRequestSourceType SourceType { get; set; } = CommunityRequestSourceType.Manual;

    public Guid CreatedByUserId { get; set; }

    public User CreatedByUser { get; set; } = null!;

    public CommunityRequestType Type { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string OriginLabel { get; set; } = string.Empty;

    public decimal? OriginLatitude { get; set; }

    public decimal? OriginLongitude { get; set; }

    public string DestinationLabel { get; set; } = string.Empty;

    public decimal? DestinationLatitude { get; set; }

    public decimal? DestinationLongitude { get; set; }

    public decimal CompensationAmount { get; set; }

    public decimal EstimatedPurchaseAmount { get; set; }

    public decimal FavorPlatformCommissionAmount { get; set; }

    public decimal CollaboratorEarningAmount { get; set; }

    public decimal TotalClientAmount { get; set; }

    public decimal PlatformRevenueAmount { get; set; }

    public PaymentMethod FavorPaymentMethod { get; set; } = PaymentMethod.Cash;

    public PaymentStatus FavorPaymentStatus { get; set; } = PaymentStatus.Pending;

    public DateTime? FavorPaidAtUtc { get; set; }

    public string? PricingSnapshotJson { get; set; }

    public DateTime? DeadlineUtc { get; set; }

    public CommunityRequestStatus Status { get; set; }

    public Guid? AssignedCollaboratorId { get; set; }

    public CommunityCollaborator? AssignedCollaborator { get; set; }

    public Guid? AssignedRouteId { get; set; }

    public CommunityRoute? AssignedRoute { get; set; }

    public decimal MatchScore { get; set; }

    public string? ConfirmationCode { get; set; }

    public DateTime? ConfirmationCodeExpiresAtUtc { get; set; }

    public int ConfirmationCodeVersion { get; set; }

    public int ConfirmationCodeFailedAttempts { get; set; }

    public int ConfirmationCodeRegenerations { get; set; }

    public DateTime? ConfirmationCodeLockedAtUtc { get; set; }

    public string? PickupCode { get; set; }

    public DateTime? PickupCodeExpiresAtUtc { get; set; }

    public int PickupCodeVersion { get; set; }

    public int PickupCodeFailedAttempts { get; set; }

    public DateTime? PickupCodeLockedAtUtc { get; set; }

    public DateTime? PickupConfirmedAtUtc { get; set; }

    public string? ProofImageUrl { get; set; }

    public int? CollaboratorRating { get; set; }

    public string? CollaboratorFeedback { get; set; }

    public DateTime? AcceptedAtUtc { get; set; }

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? DeliveredAtUtc { get; set; }

    public DateTime? ClientConfirmedAtUtc { get; set; }

    public DateTime? CancelledAtUtc { get; set; }

    public string? CancellationReason { get; set; }

    public ICollection<CommunityRequestApplication> Applications { get; set; } = new List<CommunityRequestApplication>();
}
