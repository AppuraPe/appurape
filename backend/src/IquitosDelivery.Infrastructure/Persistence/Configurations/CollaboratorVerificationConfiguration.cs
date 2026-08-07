using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CollaboratorVerificationConfiguration : IEntityTypeConfiguration<CollaboratorVerification>
{
    public void Configure(EntityTypeBuilder<CollaboratorVerification> builder)
    {
        builder.ToTable("collaborator_verifications");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.VerificationFeeAmount).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.SubmittedAtUtc).IsRequired();
        builder.Property(x => x.ReviewedAtUtc);
        builder.Property(x => x.RejectReason).HasMaxLength(1000);
        builder.Property(x => x.ExpiresAtUtc);

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.PaymentId);
        builder.HasIndex(x => x.ReviewedByAdminId);
        builder.HasIndex(x => x.UserId)
            .IsUnique()
            .HasFilter($"\"Status\" IN ({(int)CollaboratorVerificationStatus.PendingVerification}, {(int)CollaboratorVerificationStatus.Verified})");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Payment)
            .WithMany()
            .HasForeignKey(x => x.PaymentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.ReviewedByAdmin)
            .WithMany()
            .HasForeignKey(x => x.ReviewedByAdminId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
