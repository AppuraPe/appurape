using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PaymentEvidenceConfiguration : IEntityTypeConfiguration<PaymentEvidence>
{
    public void Configure(EntityTypeBuilder<PaymentEvidence> builder)
    {
        builder.ToTable("payment_evidence");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OperationNumber).HasMaxLength(80).IsRequired();
        builder.Property(x => x.DeclaredAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.PrivateObjectPath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.ContentSha256).HasMaxLength(64).IsRequired();
        builder.Property(x => x.DuplicateOverrideReason).HasMaxLength(500);
        builder.HasIndex(x => x.PaymentId).IsUnique().HasFilter("\"IsActive\" = TRUE");
        builder.HasIndex(x => new { x.Method, x.OperationNumber }).IsUnique().HasFilter("\"IsActive\" = TRUE");
        builder.HasIndex(x => x.ContentSha256).IsUnique().HasFilter("\"IsActive\" = TRUE");
        builder.HasOne(x => x.Payment).WithMany(x => x.Evidence).HasForeignKey(x => x.PaymentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.SubmittedByUser).WithMany().HasForeignKey(x => x.SubmittedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
