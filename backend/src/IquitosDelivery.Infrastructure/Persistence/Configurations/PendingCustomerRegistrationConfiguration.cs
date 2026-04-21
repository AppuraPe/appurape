using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PendingCustomerRegistrationConfiguration : IEntityTypeConfiguration<PendingCustomerRegistration>
{
    public void Configure(EntityTypeBuilder<PendingCustomerRegistration> builder)
    {
        builder.ToTable("pending_customer_registrations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.VerificationCodeHash).HasMaxLength(500).IsRequired();
        builder.Property(x => x.CodeExpiresAtUtc).IsRequired();
        builder.Property(x => x.IsVerified).IsRequired();
        builder.Property(x => x.VerifiedAtUtc);
        builder.Property(x => x.IsCompleted).IsRequired();
        builder.Property(x => x.SendCount).IsRequired();
        builder.Property(x => x.VerifyAttempts).IsRequired();
        builder.Property(x => x.LastSentAtUtc);
        builder.Property(x => x.CompletedAtUtc);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);

        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => new { x.Email, x.IsCompleted });
        builder.HasIndex(x => new { x.Email, x.IsVerified, x.IsCompleted });
    }
}
