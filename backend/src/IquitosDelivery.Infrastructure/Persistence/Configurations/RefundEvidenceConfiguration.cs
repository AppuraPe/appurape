using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class RefundEvidenceConfiguration : IEntityTypeConfiguration<RefundEvidence>
{
    public void Configure(EntityTypeBuilder<RefundEvidence> builder)
    {
        builder.ToTable("refund_evidence");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OperationNumber).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PrivateObjectPath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.ContentSha256).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => x.RefundRequestId).IsUnique();
        builder.HasIndex(x => x.ContentSha256).IsUnique();
        builder.HasOne(x => x.RefundRequest).WithMany(x => x.Evidence).HasForeignKey(x => x.RefundRequestId).OnDelete(DeleteBehavior.Cascade);
    }
}
