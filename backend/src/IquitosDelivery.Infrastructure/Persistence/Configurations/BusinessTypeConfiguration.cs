using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class BusinessTypeConfiguration : IEntityTypeConfiguration<BusinessType>
{
    public void Configure(EntityTypeBuilder<BusinessType> builder)
    {
        builder.ToTable("business_types");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.IsActive).IsRequired();

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.Name).IsUnique();
    }
}
