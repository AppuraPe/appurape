using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class CommissionRuleConfiguration : IEntityTypeConfiguration<CommissionRule>
{
    public void Configure(EntityTypeBuilder<CommissionRule> builder)
    {
        builder.ToTable("commission_rules");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.Scope).IsRequired();
        builder.Property(x => x.ValueType).IsRequired();
        builder.Property(x => x.Value).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.MinAmount).HasPrecision(10, 2);
        builder.Property(x => x.MaxAmount).HasPrecision(10, 2);
        builder.Property(x => x.Priority).IsRequired();
        builder.Property(x => x.IsEnabled).IsRequired();
        builder.Property(x => x.EffectiveFromUtc);
        builder.Property(x => x.EffectiveToUtc);

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.Scope);
    }
}
