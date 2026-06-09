using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PasswordResetRequestConfiguration : IEntityTypeConfiguration<PasswordResetRequest>
{
    public void Configure(EntityTypeBuilder<PasswordResetRequest> builder)
    {
        builder.ToTable("password_reset_requests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.CodeHash).HasMaxLength(500).IsRequired();
        builder.Property(x => x.CodeExpiresAtUtc).IsRequired();
        builder.Property(x => x.SendCount).IsRequired();
        builder.Property(x => x.VerifyAttempts).IsRequired();
        builder.Property(x => x.LastSentAtUtc);
        builder.Property(x => x.CompletedAtUtc);
        builder.Property(x => x.IsCompleted).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);

        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => new { x.Email, x.IsCompleted });
    }
}
