using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Infrastructure.Persistence;

public static class AppDbContextSeeder
{
    private const string AdminEmail = "admin@iquitosdelivery.local";
    private const string AdminPassword = "Admin123*";
    private static readonly Guid RestaurantBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F15");
    private static readonly Guid CommercialBusinessCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F101");
    private static readonly Guid CommercialDeliveryCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F102");
    private static readonly Guid CommercialServiceFeeRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F103");
    private static readonly Guid CommunityFavorCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F104");

    public static async Task SeedBaseDataAsync(AppDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        await SeedZonesAsync(dbContext, cancellationToken);
        await SeedBusinessTypesAsync(dbContext, cancellationToken);
        await SeedCommissionRulesAsync(dbContext, cancellationToken);
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

    private static async Task SeedBusinessTypesAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var businessType = await dbContext.BusinessTypes.FirstOrDefaultAsync(x => x.Code == "Restaurant", cancellationToken);

        if (businessType is null)
        {
            dbContext.BusinessTypes.Add(new BusinessType
            {
                Id = RestaurantBusinessTypeId,
                Code = "Restaurant",
                Name = "Restaurant",
                Description = "Legacy-compatible business type for the current restaurant marketplace.",
                IsActive = true
            });
        }
        else
        {
            businessType.Name = "Restaurant";
            businessType.Description = "Legacy-compatible business type for the current restaurant marketplace.";
            businessType.IsActive = true;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var uncategorizedRestaurants = await dbContext.Restaurants
            .Where(x => x.BusinessTypeId == null)
            .ToListAsync(cancellationToken);

        if (uncategorizedRestaurants.Count == 0)
        {
            return;
        }

        var resolvedBusinessTypeId = businessType?.Id ?? RestaurantBusinessTypeId;

        foreach (var restaurant in uncategorizedRestaurants)
        {
            restaurant.BusinessTypeId = resolvedBusinessTypeId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedCommissionRulesAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        await UpsertCommissionRuleAsync(
            dbContext,
            CommercialBusinessCommissionRuleId,
            FinancialRuleCodes.CommercialBusinessCommission,
            "Commercial business commission",
            "Percentage commission charged to the business subtotal on commercial orders.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.Percentage,
            12m,
            10,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CommercialDeliveryCommissionRuleId,
            FinancialRuleCodes.CommercialDeliveryPlatformCommission,
            "Commercial delivery platform commission",
            "Percentage retained by the platform from the delivery fee.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.Percentage,
            15m,
            20,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CommercialServiceFeeRuleId,
            FinancialRuleCodes.CommercialServiceFee,
            "Commercial service fee",
            "Optional service fee added to commercial orders. Seeded at zero for compatibility.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.FlatAmount,
            0m,
            30,
            false,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CommunityFavorCommissionRuleId,
            FinancialRuleCodes.CommunityFavorPlatformCommission,
            "Community favor platform commission",
            "Percentage retained by the platform from the collaborator reward.",
            CommissionRuleScope.CommunityRequest,
            CommissionValueType.Percentage,
            10m,
            10,
            true,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task UpsertCommissionRuleAsync(
        AppDbContext dbContext,
        Guid id,
        string code,
        string name,
        string description,
        CommissionRuleScope scope,
        CommissionValueType valueType,
        decimal value,
        int priority,
        bool isEnabled,
        CancellationToken cancellationToken)
    {
        var rule = await dbContext.CommissionRules.FirstOrDefaultAsync(x => x.Code == code, cancellationToken);

        if (rule is null)
        {
            dbContext.CommissionRules.Add(new CommissionRule
            {
                Id = id,
                Code = code,
                Name = name,
                Description = description,
                Scope = scope,
                ValueType = valueType,
                Value = value,
                Priority = priority,
                IsEnabled = isEnabled
            });

            return;
        }

        rule.Name = name;
        rule.Description = description;
        rule.Scope = scope;
        rule.ValueType = valueType;
        rule.Value = value;
        rule.Priority = priority;
        rule.IsEnabled = isEnabled;
    }
}
