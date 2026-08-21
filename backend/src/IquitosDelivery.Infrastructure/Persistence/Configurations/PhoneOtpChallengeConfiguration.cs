using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PhoneOtpChallengeConfiguration : IEntityTypeConfiguration<PhoneOtpChallenge>
{
    public void Configure(EntityTypeBuilder<PhoneOtpChallenge> builder)
    {
        builder.ToTable("phone_otp_challenges");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PhoneNormalized).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Purpose).HasMaxLength(50).IsRequired();
        builder.Property(x => x.CodeHash).HasMaxLength(500).IsRequired();
        builder.Property(x => x.CodeExpiresAtUtc).IsRequired();
        builder.Property(x => x.IsVerified).IsRequired();
        builder.Property(x => x.VerifiedAtUtc);
        builder.Property(x => x.IsCompleted).IsRequired();
        builder.Property(x => x.SendCount).IsRequired();
        builder.Property(x => x.VerifyAttempts).IsRequired();
        builder.Property(x => x.LastSentAtUtc);
        builder.Property(x => x.CompletedAtUtc);
        builder.Property(x => x.Channel).HasMaxLength(30).IsRequired();
        builder.Property(x => x.ProviderMessageId).HasMaxLength(150);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);

        builder.HasIndex(x => x.PhoneNormalized);
        builder.HasIndex(x => new { x.PhoneNormalized, x.Purpose, x.IsCompleted });
        builder.HasIndex(x => new { x.PhoneNormalized, x.Purpose, x.IsVerified, x.IsCompleted });
    }
}
