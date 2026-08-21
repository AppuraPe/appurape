using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.PhoneNormalized).HasMaxLength(20);
        builder.Property(x => x.IsPhoneVerified).IsRequired();
        builder.Property(x => x.PhoneVerifiedAtUtc);
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.IdentityDocumentType).HasMaxLength(20).HasDefaultValue("DNI").IsRequired();
        builder.Property(x => x.IdentityDocumentNumber).HasMaxLength(30);
        builder.Property(x => x.IdentityDocumentNumberNormalized).HasMaxLength(30);
        builder.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        builder.Property(x => x.GoogleSubject).HasMaxLength(128);
        builder.Property(x => x.Role).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);

        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.GoogleSubject).IsUnique();
        builder.HasIndex(x => x.PhoneNormalized)
            .IsUnique()
            .HasFilter("\"PhoneNormalized\" IS NOT NULL AND \"PhoneNormalized\" <> ''");
        builder.HasIndex(x => x.IdentityDocumentNumberNormalized)
            .IsUnique()
            .HasFilter("\"IdentityDocumentNumberNormalized\" IS NOT NULL AND \"IdentityDocumentNumberNormalized\" <> ''");

        builder.HasOne(x => x.CustomerProfile)
            .WithOne(x => x.User)
            .HasForeignKey<CustomerProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DriverProfile)
            .WithOne(x => x.User)
            .HasForeignKey<DriverProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CollaboratorProfile)
            .WithOne(x => x.User)
            .HasForeignKey<CollaboratorProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CommunityCollaborator)
            .WithOne(x => x.User)
            .HasForeignKey<CommunityCollaborator>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.OwnedRestaurants)
            .WithOne(x => x.OwnerUser)
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
