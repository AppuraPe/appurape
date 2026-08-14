using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class SettlementBatchConfiguration : IEntityTypeConfiguration<SettlementBatch>
{
    public void Configure(EntityTypeBuilder<SettlementBatch> builder)
    {
        builder.ToTable("settlement_batches");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TargetType).IsRequired();
        builder.Property(x => x.PeriodStartUtc).IsRequired();
        builder.Property(x => x.PeriodEndUtc).IsRequired();
        builder.Property(x => x.GrossAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.CommissionAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.ServiceFeeAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.NetAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.ConfirmedAtUtc);
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.Property(x => x.PaymentOperationNumber).HasMaxLength(120);
        builder.Property(x => x.PaymentEvidenceObjectPath).HasMaxLength(500);
        builder.Property(x => x.PaymentEvidenceSha256).HasMaxLength(64);
        builder.Property(x => x.Version).IsRowVersion();

        builder.HasIndex(x => x.TargetType);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.BusinessId);
        builder.HasIndex(x => x.DriverId);
        builder.HasIndex(x => x.CollaboratorUserId);

        builder.HasOne(x => x.Business)
            .WithMany()
            .HasForeignKey(x => x.BusinessId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Driver)
            .WithMany()
            .HasForeignKey(x => x.DriverId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.CollaboratorUser)
            .WithMany()
            .HasForeignKey(x => x.CollaboratorUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.ConfirmedByAdmin)
            .WithMany()
            .HasForeignKey(x => x.ConfirmedByAdminId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
