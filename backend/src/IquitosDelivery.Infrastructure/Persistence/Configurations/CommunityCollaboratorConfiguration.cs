using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CommunityCollaboratorConfiguration : IEntityTypeConfiguration<CommunityCollaborator>
{
    public void Configure(EntityTypeBuilder<CommunityCollaborator> builder)
    {
        builder.ToTable("community_collaborators");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.IsAvailable).IsRequired();
        builder.Property(x => x.AvailabilityStatus).IsRequired();
        builder.Property(x => x.AvailabilityRadiusKm).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.CurrentLatitude).HasPrecision(9, 6);
        builder.Property(x => x.CurrentLongitude).HasPrecision(9, 6);
        builder.Property(x => x.TrustScore).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.CollaborationRating).HasPrecision(3, 2).IsRequired();
        builder.Property(x => x.CommunityAcceptanceRate).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.CommunityCancellationRate).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.CollaborationLevel).IsRequired();

        builder.HasIndex(x => x.UserId).IsUnique();

        builder.HasMany(x => x.Routes)
            .WithOne(x => x.CommunityCollaborator)
            .HasForeignKey(x => x.CommunityCollaboratorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.AssignedRequests)
            .WithOne(x => x.AssignedCollaborator)
            .HasForeignKey(x => x.AssignedCollaboratorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
