using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Infrastructure.Persistence;

public static class AppDbContextSeeder
{
    private const string AdminEmail = "admin@iquitosdelivery.local";
    private const string AdminPassword = "Admin123*";

    public static async Task SeedBaseDataAsync(AppDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        await SeedZonesAsync(dbContext, cancellationToken);
        await SeedAdminAsync(dbContext, passwordHasher, cancellationToken);
    }

    private static async Task SeedAdminAsync(AppDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken)
    {
        var normalizedEmail = AdminEmail.ToLowerInvariant();
        var exists = await dbContext.Users.AnyAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (exists)
        {
            return;
        }

        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FirstName = "System",
            LastName = "Admin",
            Phone = "000000000",
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(AdminPassword),
            Role = UserRole.Admin,
            Status = UserStatus.Active
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedZonesAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var zones = new[]
        {
            new { Name = "Centro", DeliveryFee = 5.00m },
            new { Name = "Punchana", DeliveryFee = 6.00m },
            new { Name = "San Juan", DeliveryFee = 7.00m },
            new { Name = "Belen", DeliveryFee = 6.50m }
        };

        foreach (var zone in zones)
        {
            var existingZone = await dbContext.Zones.FirstOrDefaultAsync(
                x => x.Name.ToLower() == zone.Name.ToLower(),
                cancellationToken);

            if (existingZone is null)
            {
                dbContext.Zones.Add(new Zone
                {
                    Id = Guid.NewGuid(),
                    Name = zone.Name,
                    DeliveryFee = zone.DeliveryFee,
                    IsActive = true
                });

                continue;
            }

            existingZone.DeliveryFee = zone.DeliveryFee;
            existingZone.IsActive = true;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
