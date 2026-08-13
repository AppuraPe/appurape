using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CollaboratorProfileConfiguration : IEntityTypeConfiguration<CollaboratorProfile>
{
    public void Configure(EntityTypeBuilder<CollaboratorProfile> builder)
    {
        builder.ToTable("collaborator_profiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ApprovalStatus).IsRequired();
        builder.Property(x => x.IsIdentityVerified).IsRequired();
        builder.Property(x => x.IsPhoneVerified).IsRequired();
        builder.Property(x => x.IdentityDocumentNumber).HasMaxLength(30);
        builder.Property(x => x.IdentityDocumentUrl).HasMaxLength(500);
        builder.Property(x => x.ProfilePhotoUrl).HasMaxLength(500);
        builder.Property(x => x.LiveSelfieUrl).HasMaxLength(500);
        builder.Property(x => x.Notes).HasMaxLength(1000);

        builder.HasIndex(x => x.UserId).IsUnique();

        builder.HasOne(x => x.User)
            .WithOne(x => x.CollaboratorProfile)
            .HasForeignKey<CollaboratorProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
