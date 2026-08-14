using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class FinancialObligationConfiguration : IEntityTypeConfiguration<FinancialObligation>
{
    public void Configure(EntityTypeBuilder<FinancialObligation> builder)
    {
        builder.ToTable("financial_obligations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Amount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.CurrencyCode).HasMaxLength(8).IsRequired();
        builder.Property(x => x.SnapshotJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Reference).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Version).IsRowVersion();
        builder.HasIndex(x => new { x.OrderId, x.Concept }).IsUnique().HasFilter("\"OrderId\" IS NOT NULL AND \"ReversalOfId\" IS NULL");
        builder.HasIndex(x => new { x.CommunityRequestId, x.Concept }).IsUnique().HasFilter("\"CommunityRequestId\" IS NOT NULL AND \"ReversalOfId\" IS NULL");
        builder.HasIndex(x => new { x.DebtorType, x.DebtorEntityId, x.Status });
        builder.HasIndex(x => new { x.CreditorType, x.CreditorEntityId, x.Status });
        builder.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.CommunityRequest).WithMany().HasForeignKey(x => x.CommunityRequestId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.RefundRequest).WithMany().HasForeignKey(x => x.RefundRequestId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.ReversalOf).WithMany().HasForeignKey(x => x.ReversalOfId).OnDelete(DeleteBehavior.Restrict);
    }
}
