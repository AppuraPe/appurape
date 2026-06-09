using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IquitosDelivery.Infrastructure.Persistence.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("menu_items");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Price).HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.ImageUrl).HasMaxLength(500);
        builder.Property(x => x.Sku).HasMaxLength(80);
        builder.Property(x => x.UnitLabel).HasMaxLength(50);
        builder.Property(x => x.TrackStock).IsRequired();
        builder.Property(x => x.StockQuantity);

        builder.HasOne(x => x.Restaurant)
            .WithMany(x => x.MenuItems)
            .HasForeignKey(x => x.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Category)
            .WithMany(x => x.MenuItems)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.OrderItems)
            .WithOne(x => x.MenuItem)
            .HasForeignKey(x => x.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
