using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class FinancialMovementConfiguration : IEntityTypeConfiguration<FinancialMovement>
{
    public void Configure(EntityTypeBuilder<FinancialMovement> builder)
    {
        builder.ToTable("financial_movements");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.CurrencyCode).HasMaxLength(8).IsRequired();
        builder.Property(x => x.OccurredAtUtc).IsRequired();
        builder.Property(x => x.AvailableAtUtc);
        builder.Property(x => x.SettledAtUtc);
        builder.Property(x => x.Reference).HasMaxLength(120);
        builder.Property(x => x.Description).HasMaxLength(1000);

        builder.HasIndex(x => x.OrderId);
        builder.HasIndex(x => x.CommunityRequestId);
        builder.HasIndex(x => x.RestaurantId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Type);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.OrderId, x.Type })
            .IsUnique()
            .HasFilter("\"OrderId\" IS NOT NULL");
        builder.HasIndex(x => new { x.CommunityRequestId, x.Type })
            .IsUnique()
            .HasFilter("\"CommunityRequestId\" IS NOT NULL");

        builder.HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.CommunityRequest)
            .WithMany()
            .HasForeignKey(x => x.CommunityRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Restaurant)
            .WithMany()
            .HasForeignKey(x => x.RestaurantId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
