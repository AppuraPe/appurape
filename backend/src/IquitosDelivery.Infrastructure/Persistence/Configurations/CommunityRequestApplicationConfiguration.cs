using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CommunityRequestApplicationConfiguration : IEntityTypeConfiguration<CommunityRequestApplication>
{
    public void Configure(EntityTypeBuilder<CommunityRequestApplication> builder)
    {
        builder.ToTable("community_request_applications");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.MatchScore).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.DistanceKm).HasPrecision(7, 2).IsRequired();
        builder.Property(x => x.EstimatedMinutes).IsRequired();
        builder.Property(x => x.HasRouteMatch).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.AppliedAtUtc).IsRequired();
        builder.Property(x => x.ReviewedAtUtc);

        builder.HasIndex(x => new { x.CommunityRequestId, x.CollaboratorId }).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.CommunityRequest)
            .WithMany(x => x.Applications)
            .HasForeignKey(x => x.CommunityRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Collaborator)
            .WithMany(x => x.Applications)
            .HasForeignKey(x => x.CollaboratorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Route)
            .WithMany()
            .HasForeignKey(x => x.RouteId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
