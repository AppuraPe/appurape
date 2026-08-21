using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PendingDriverRegistrationConfiguration : IEntityTypeConfiguration<PendingDriverRegistration>
{
    public void Configure(EntityTypeBuilder<PendingDriverRegistration> builder)
    {
        builder.ToTable("pending_driver_registrations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.PhoneNormalized).HasMaxLength(20);
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.IdentityDocumentType).HasMaxLength(20).HasDefaultValue("DNI").IsRequired();
        builder.Property(x => x.IdentityDocumentNumber).HasMaxLength(30).IsRequired();
        builder.Property(x => x.IdentityDocumentNumberNormalized).HasMaxLength(30);
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
        builder.Property(x => x.Plate).HasMaxLength(20).IsRequired();
        builder.Property(x => x.ZoneId).IsRequired();
        builder.Property(x => x.VehicleType).IsRequired();
        builder.Property(x => x.IdentityDocumentUrl).HasMaxLength(500);
        builder.Property(x => x.VehiclePhotoUrl).HasMaxLength(500);

        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => new { x.Email, x.IsCompleted });
        builder.HasIndex(x => new { x.Email, x.IsVerified, x.IsCompleted });
        builder.HasIndex(x => new { x.PhoneNormalized, x.IsCompleted });
        builder.HasIndex(x => new { x.IdentityDocumentNumberNormalized, x.IsCompleted });
    }
}
