using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class OrderDeliveryConfirmationAuditConfiguration : IEntityTypeConfiguration<OrderDeliveryConfirmationAudit>
{
    public void Configure(EntityTypeBuilder<OrderDeliveryConfirmationAudit> builder)
    {
        builder.ToTable("order_delivery_confirmation_audits");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(500);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.HasIndex(x => new { x.OrderId, x.CreatedAtUtc });
        builder.HasOne(x => x.ActorUser).WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
