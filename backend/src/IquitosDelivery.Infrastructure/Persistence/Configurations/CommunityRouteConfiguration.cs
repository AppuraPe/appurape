using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CommunityRouteConfiguration : IEntityTypeConfiguration<CommunityRoute>
{
    public void Configure(EntityTypeBuilder<CommunityRoute> builder)
    {
        builder.ToTable("community_routes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.OriginLabel).HasMaxLength(200).IsRequired();
        builder.Property(x => x.DestinationLabel).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OriginLatitude).HasPrecision(9, 6).IsRequired();
        builder.Property(x => x.OriginLongitude).HasPrecision(9, 6).IsRequired();
        builder.Property(x => x.DestinationLatitude).HasPrecision(9, 6).IsRequired();
        builder.Property(x => x.DestinationLongitude).HasPrecision(9, 6).IsRequired();
        builder.Property(x => x.EstimatedMinutes).IsRequired();
        builder.Property(x => x.DeviationRadiusKm).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.StartsAtUtc);
        builder.Property(x => x.EndsAtUtc);
    }
}
