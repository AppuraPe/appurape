using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class UserLegalAcceptanceConfiguration : IEntityTypeConfiguration<UserLegalAcceptance>
{
    public void Configure(EntityTypeBuilder<UserLegalAcceptance> builder)
    {
        builder.ToTable("user_legal_acceptances");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DocumentVersion).HasMaxLength(30).IsRequired();
        builder.Property(x => x.DocumentHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Role).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Platform).HasMaxLength(30);
        builder.Property(x => x.AppVersion).HasMaxLength(40);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.Property(x => x.UserAgent).HasMaxLength(500);
        builder.HasIndex(x => new { x.UserId, x.LegalDocumentId }).IsUnique();
        builder.HasOne(x => x.User).WithMany(x => x.LegalAcceptances).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.LegalDocument).WithMany(x => x.Acceptances).HasForeignKey(x => x.LegalDocumentId).OnDelete(DeleteBehavior.Restrict);
    }
}
