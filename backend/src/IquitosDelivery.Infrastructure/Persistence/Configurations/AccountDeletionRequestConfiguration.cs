using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class AccountDeletionRequestConfiguration : IEntityTypeConfiguration<AccountDeletionRequest>
{
    public void Configure(EntityTypeBuilder<AccountDeletionRequest> builder)
    {
        builder.ToTable("account_deletion_requests");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.VerificationCodeHash).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => new { x.UserId, x.Status });
        builder.HasIndex(x => new { x.Status, x.ScheduledForUtc });
        builder.HasOne(x => x.User).WithMany(x => x.AccountDeletionRequests).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
