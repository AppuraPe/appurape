using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class PlatformSettingsConfiguration : IEntityTypeConfiguration<PlatformSettings>
{
    public void Configure(EntityTypeBuilder<PlatformSettings> builder)
    {
        builder.ToTable("platform_settings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Key).HasMaxLength(50).IsRequired();
        builder.Property(x => x.AppName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Tagline).HasMaxLength(240);
        builder.Property(x => x.LogoUrl).HasMaxLength(1000);
        builder.Property(x => x.AppIconUrl).HasMaxLength(1000);
        builder.Property(x => x.SplashImageUrl).HasMaxLength(1000);
        builder.Property(x => x.PrimaryColor).HasMaxLength(20);
        builder.Property(x => x.SecondaryColor).HasMaxLength(20);
        builder.Property(x => x.SupportEmail).HasMaxLength(200);
        builder.Property(x => x.SupportPhone).HasMaxLength(50);

        builder.HasIndex(x => x.Key).IsUnique();
    }
}
