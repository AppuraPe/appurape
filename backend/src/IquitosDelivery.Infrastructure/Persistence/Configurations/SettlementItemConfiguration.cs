using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class SettlementItemConfiguration : IEntityTypeConfiguration<SettlementItem>
{
    public void Configure(EntityTypeBuilder<SettlementItem> builder)
    {
        builder.ToTable("settlement_items");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.GrossAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.CommissionAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.ServiceFeeAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.NetAmount).HasPrecision(10, 2).IsRequired();

        builder.HasIndex(x => new { x.SettlementBatchId, x.FinancialMovementId }).IsUnique();

        builder.HasOne(x => x.SettlementBatch)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.SettlementBatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.FinancialMovement)
            .WithMany()
            .HasForeignKey(x => x.FinancialMovementId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
