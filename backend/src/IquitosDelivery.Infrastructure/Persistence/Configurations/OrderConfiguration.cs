using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClientRequestId).HasMaxLength(80);
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.PaymentMethod).IsRequired();
        builder.Property(x => x.Subtotal).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.BusinessCommissionAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.BusinessNetAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.DeliveryFee).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.DeliveryMode).IsRequired();
        builder.Property(x => x.DeliveryMinimumAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.DeliveryPlatformCommissionAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.CourierEarningAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.ServiceFeeAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.DiscountAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PlatformRevenueAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.Total).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PricingSnapshotJson);
        builder.Property(x => x.DeliveryAddress).HasMaxLength(300).IsRequired();
        builder.Property(x => x.DeliveryReference).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);
        builder.Property(x => x.AcceptedAtUtc);
        builder.Property(x => x.ReadyAtUtc);
        builder.Property(x => x.PickedUpAtUtc);
        builder.Property(x => x.DeliveredAtUtc);
        builder.Property(x => x.DeliveryConfirmationVersion).HasDefaultValue(0);
        builder.Property(x => x.DeliveryConfirmationFailedAttempts).HasDefaultValue(0);
        builder.Property(x => x.DeliveryConfirmationRegenerations).HasDefaultValue(0);
        builder.Property(x => x.AssignedCourierUserId);
        builder.Property(x => x.AssignedCourierType);
        builder.Property(x => x.DriverRating);
        builder.Property(x => x.DriverFeedback).HasMaxLength(1000);

        builder.HasIndex(x => x.AssignedCourierUserId);
        builder.HasIndex(x => x.CustomerId);
        builder.HasIndex(x => new { x.CustomerId, x.ClientRequestId })
            .IsUnique()
            .HasFilter("\"ClientRequestId\" IS NOT NULL");

        builder.HasOne(x => x.Customer)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Restaurant)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Driver)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.DriverId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Zone)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Items)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Incidents)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.DeliveryConfirmationAudits)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
