using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class DriverProfileConfiguration : IEntityTypeConfiguration<DriverProfile>
{
    public void Configure(EntityTypeBuilder<DriverProfile> builder)
    {
        builder.ToTable("driver_profiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Plate).HasMaxLength(20).IsRequired();
        builder.Property(x => x.VehicleType).IsRequired();
        builder.Property(x => x.ApprovalStatus).IsRequired();
        builder.Property(x => x.TrustLevel).IsRequired();
        builder.Property(x => x.CompletedDeliveriesCount).IsRequired();
        builder.Property(x => x.TrustScore).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.IdentityDocumentUrl).HasMaxLength(500);
        builder.Property(x => x.VehiclePhotoUrl).HasMaxLength(500);

        builder.HasOne(x => x.User)
            .WithOne(x => x.DriverProfile)
            .HasForeignKey<DriverProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Zone)
            .WithMany(x => x.Drivers)
            .HasForeignKey(x => x.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Orders)
            .WithOne(x => x.Driver)
            .HasForeignKey(x => x.DriverId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
