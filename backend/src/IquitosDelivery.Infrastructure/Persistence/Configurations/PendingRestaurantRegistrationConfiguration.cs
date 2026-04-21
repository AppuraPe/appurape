using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PendingRestaurantRegistrationConfiguration : IEntityTypeConfiguration<PendingRestaurantRegistration>
{
    public void Configure(EntityTypeBuilder<PendingRestaurantRegistration> builder)
    {
        builder.ToTable("pending_restaurant_registrations");

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
        builder.Property(x => x.RestaurantName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Reference).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ZoneId).IsRequired();
        builder.Property(x => x.OpenTime).IsRequired();
        builder.Property(x => x.CloseTime).IsRequired();

        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => new { x.Email, x.IsCompleted });
        builder.HasIndex(x => new { x.Email, x.IsVerified, x.IsCompleted });
    }
}
