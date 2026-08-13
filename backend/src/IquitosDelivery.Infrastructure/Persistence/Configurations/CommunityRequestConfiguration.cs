using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CommunityRequestConfiguration : IEntityTypeConfiguration<CommunityRequest>
{
    public void Configure(EntityTypeBuilder<CommunityRequest> builder)
    {
        builder.ToTable("community_requests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceType).IsRequired();
        builder.Property(x => x.Type).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.OriginLabel).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OriginLatitude).HasPrecision(9, 6);
        builder.Property(x => x.OriginLongitude).HasPrecision(9, 6);
        builder.Property(x => x.DestinationLabel).HasMaxLength(200).IsRequired();
        builder.Property(x => x.DestinationLatitude).HasPrecision(9, 6);
        builder.Property(x => x.DestinationLongitude).HasPrecision(9, 6);
        builder.Property(x => x.CompensationAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.EstimatedPurchaseAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.FavorPlatformCommissionAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.CollaboratorEarningAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.TotalClientAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PlatformRevenueAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PricingSnapshotJson);
        builder.Property(x => x.DeadlineUtc);
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.MatchScore).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.ConfirmationCode).HasMaxLength(20);
        builder.Property(x => x.ConfirmationCodeExpiresAtUtc);
        builder.Property(x => x.PickupCode).HasMaxLength(20);
        builder.Property(x => x.PickupCodeExpiresAtUtc);
        builder.Property(x => x.PickupConfirmedAtUtc);
        builder.Property(x => x.ProofImageUrl).HasMaxLength(500);
        builder.Property(x => x.CollaboratorFeedback).HasMaxLength(1000);
        builder.Property(x => x.CancellationReason).HasMaxLength(500);
        builder.Property(x => x.AcceptedAtUtc);
        builder.Property(x => x.StartedAtUtc);
        builder.Property(x => x.DeliveredAtUtc);
        builder.Property(x => x.ClientConfirmedAtUtc);
        builder.Property(x => x.CancelledAtUtc);

        builder.HasIndex(x => x.CreatedByUserId);
        builder.HasIndex(x => x.OrderId)
            .IsUnique()
            .HasFilter("\"OrderId\" IS NOT NULL AND \"Status\" <> 6");
        builder.HasIndex(x => x.AssignedCollaboratorId);
        builder.HasIndex(x => x.Status);

        builder.HasMany(x => x.Applications)
            .WithOne(x => x.CommunityRequest)
            .HasForeignKey(x => x.CommunityRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Order)
            .WithMany(x => x.CommunityRequests)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
