using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Infrastructure.Persistence;

public static class AppDbContextSeeder
{
    private const string AdminEmail = "admin@iquitosdelivery.local";
    private const string DefaultLocalSeedPassword = "ChangeMe.LocalOnly.123!";
    private const string DevelopmentQaCustomerEmail = "client.customer.1778016513@appurape.dev";
    private const string DevelopmentQaBusinessEmail = "client.rest.1778016513@appurape.dev";
    private const string DevelopmentQaDriverEmail = "client.driver.1778016513@appurape.dev";
    private static readonly Guid RestaurantBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F15");
    private static readonly Guid HardwareBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F16");
    private static readonly Guid GroceryBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F17");
    private static readonly Guid PharmacyBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F18");
    private static readonly Guid ClothingBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F19");
    private static readonly Guid CommercialBusinessCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F101");
    private static readonly Guid CommercialDeliveryCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F102");
    private static readonly Guid CommercialServiceFeeRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F103");
    private static readonly Guid CommunityFavorCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F104");

    public static async Task SeedBaseDataAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        await SeedZonesAsync(dbContext, cancellationToken);
        await SeedBusinessTypesAsync(dbContext, cancellationToken);
        await SeedCommissionRulesAsync(dbContext, cancellationToken);
        await SeedAdminAsync(dbContext, passwordHasher, configuration, cancellationToken);
    }

    public static async Task SeedDevelopmentQaUsersAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var belenZoneId = await dbContext.Zones
            .Where(x => x.Name == "Belen")
            .Select(x => x.Id)
            .FirstAsync(cancellationToken);

        var qaPassword = ResolveSeedPassword(configuration, "SeedUsers:QaPassword");
        await UpsertDevelopmentCustomerAsync(dbContext, passwordHasher, qaPassword, cancellationToken);
        await UpsertDevelopmentBusinessAsync(dbContext, passwordHasher, qaPassword, belenZoneId, cancellationToken);
        await UpsertDevelopmentDriverAsync(dbContext, passwordHasher, qaPassword, belenZoneId, cancellationToken);
    }

    private static async Task SeedAdminAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var adminPassword = ResolveSeedPassword(configuration, "SeedUsers:AdminPassword");
        var normalizedEmail = AdminEmail.ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (user is not null)
        {
            user.FirstName = "System";
            user.LastName = "Admin";
            user.Phone = "000000000";
            user.Role = UserRole.Admin;
            user.Status = UserStatus.Active;
            user.PasswordHash = passwordHasher.Hash(adminPassword);
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FirstName = "System",
            LastName = "Admin",
            Phone = "000000000",
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(adminPassword),
            Role = UserRole.Admin,
            Status = UserStatus.Active
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task UpsertDevelopmentCustomerAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        string qaPassword,
        CancellationToken cancellationToken)
    {
        var email = DevelopmentQaCustomerEmail.ToLowerInvariant();
        var user = await dbContext.Users
            .Include(x => x.CustomerProfile)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Client",
                LastName = "Customer 1778016513",
                Phone = "900177651",
                Email = email,
                PasswordHash = passwordHasher.Hash(qaPassword),
                Role = UserRole.Customer,
                Status = UserStatus.Active
            };

            dbContext.Users.Add(user);
            dbContext.Customers.Add(new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                User = user
            });
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        user.FirstName = "Client";
        user.LastName = "Customer 1778016513";
        user.Phone = "900177651";
        user.Role = UserRole.Customer;
        user.Status = UserStatus.Active;
        user.PasswordHash = passwordHasher.Hash(qaPassword);

        if (user.CustomerProfile is null)
        {
            dbContext.Customers.Add(new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task UpsertDevelopmentBusinessAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        string qaPassword,
        Guid zoneId,
        CancellationToken cancellationToken)
    {
        var email = DevelopmentQaBusinessEmail.ToLowerInvariant();
        var user = await dbContext.Users
            .Include(x => x.OwnedRestaurants)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Client",
                LastName = "Business 1778016513",
                Phone = "900177652",
                Email = email,
                PasswordHash = passwordHasher.Hash(qaPassword),
                Role = UserRole.Restaurant,
                Status = UserStatus.Active
            };

            var seededRestaurant = new Restaurant
            {
                Id = Guid.NewGuid(),
                OwnerUserId = user.Id,
                OwnerUser = user,
                Name = "Client Resto 1778016513",
                Description = "Cuenta QA local para validar login y flujo operativo.",
                Address = "Belen, Iquitos",
                Reference = "QA local",
                ZoneId = zoneId,
                BusinessTypeId = RestaurantBusinessTypeId,
                ApprovalStatus = ApprovalStatus.Approved,
                OpenTime = new TimeSpan(8, 0, 0),
                CloseTime = new TimeSpan(22, 0, 0),
                IsActive = true
            };

            dbContext.Users.Add(user);
            dbContext.Restaurants.Add(seededRestaurant);
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        user.FirstName = "Client";
        user.LastName = "Business 1778016513";
        user.Phone = "900177652";
        user.Role = UserRole.Restaurant;
        user.Status = UserStatus.Active;
        user.PasswordHash = passwordHasher.Hash(qaPassword);

        var restaurant = user.OwnedRestaurants.FirstOrDefault();
        if (restaurant is null)
        {
            dbContext.Restaurants.Add(new Restaurant
            {
                Id = Guid.NewGuid(),
                OwnerUserId = user.Id,
                Name = "Client Resto 1778016513",
                Description = "Cuenta QA local para validar login y flujo operativo.",
                Address = "Belen, Iquitos",
                Reference = "QA local",
                ZoneId = zoneId,
                BusinessTypeId = RestaurantBusinessTypeId,
                ApprovalStatus = ApprovalStatus.Approved,
                OpenTime = new TimeSpan(8, 0, 0),
                CloseTime = new TimeSpan(22, 0, 0),
                IsActive = true
            });
        }
        else
        {
            restaurant.Name = "Client Resto 1778016513";
            restaurant.Description = "Cuenta QA local para validar login y flujo operativo.";
            restaurant.Address = "Belen, Iquitos";
            restaurant.Reference = "QA local";
            restaurant.ZoneId = zoneId;
            restaurant.BusinessTypeId = RestaurantBusinessTypeId;
            restaurant.ApprovalStatus = ApprovalStatus.Approved;
            restaurant.OpenTime = new TimeSpan(8, 0, 0);
            restaurant.CloseTime = new TimeSpan(22, 0, 0);
            restaurant.IsActive = true;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task UpsertDevelopmentDriverAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        string qaPassword,
        Guid zoneId,
        CancellationToken cancellationToken)
    {
        var email = DevelopmentQaDriverEmail.ToLowerInvariant();
        var user = await dbContext.Users
            .Include(x => x.DriverProfile)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Client",
                LastName = "Driver 1778016513",
                Phone = "900177653",
                Email = email,
                PasswordHash = passwordHasher.Hash(qaPassword),
                Role = UserRole.Driver,
                Status = UserStatus.Active
            };

            dbContext.Users.Add(user);
            dbContext.Drivers.Add(new DriverProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                User = user,
                VehicleType = VehicleType.Motorcycle,
                Plate = "QA-177",
                ZoneId = zoneId,
                ApprovalStatus = ApprovalStatus.Approved,
                IsAvailable = true,
                TrustLevel = TrustLevel.Verified,
                CompletedDeliveriesCount = 0,
                TrustScore = 0m
            });
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        user.FirstName = "Client";
        user.LastName = "Driver 1778016513";
        user.Phone = "900177653";
        user.Role = UserRole.Driver;
        user.Status = UserStatus.Active;
        user.PasswordHash = passwordHasher.Hash(qaPassword);

        if (user.DriverProfile is null)
        {
            dbContext.Drivers.Add(new DriverProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                VehicleType = VehicleType.Motorcycle,
                Plate = "QA-177",
                ZoneId = zoneId,
                ApprovalStatus = ApprovalStatus.Approved,
                IsAvailable = true,
                TrustLevel = TrustLevel.Verified,
                CompletedDeliveriesCount = 0,
                TrustScore = 0m
            });
        }
        else
        {
            user.DriverProfile.VehicleType = VehicleType.Motorcycle;
            user.DriverProfile.Plate = "QA-177";
            user.DriverProfile.ZoneId = zoneId;
            user.DriverProfile.ApprovalStatus = ApprovalStatus.Approved;
            user.DriverProfile.IsAvailable = true;
            user.DriverProfile.TrustLevel = TrustLevel.Verified;
            user.DriverProfile.TrustScore = Math.Max(user.DriverProfile.TrustScore, 0m);
        }

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
        await UpsertBusinessTypeAsync(
            dbContext,
            RestaurantBusinessTypeId,
            "Restaurant",
            "Restaurantes",
            "restaurantes",
            "utensils",
            10,
            "Negocios de comida y bebida preparados para pedidos desde la app.",
            cancellationToken);

        await UpsertBusinessTypeAsync(
            dbContext,
            HardwareBusinessTypeId,
            "Hardware",
            "Ferreterías",
            "ferreterias",
            "hammer",
            20,
            "Tiendas de herramientas, materiales y artículos ferreteros.",
            cancellationToken);

        await UpsertBusinessTypeAsync(
            dbContext,
            GroceryBusinessTypeId,
            "Groceries",
            "Tiendas de alimentos",
            "tiendas-de-alimentos",
            "shopping-cart",
            30,
            "Mercados, bodegas y tiendas con productos de consumo diario.",
            cancellationToken);

        await UpsertBusinessTypeAsync(
            dbContext,
            PharmacyBusinessTypeId,
            "Pharmacy",
            "Farmacias",
            "farmacias",
            "cross",
            40,
            "Negocios enfocados en salud, cuidado personal y medicamentos.",
            cancellationToken);

        await UpsertBusinessTypeAsync(
            dbContext,
            ClothingBusinessTypeId,
            "Clothing",
            "Ropa",
            "ropa",
            "shirt",
            50,
            "Tiendas de prendas, accesorios y vestimenta.",
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        var uncategorizedRestaurants = await dbContext.Restaurants
            .Where(x => x.BusinessTypeId == null)
            .ToListAsync(cancellationToken);

        if (uncategorizedRestaurants.Count == 0)
        {
            return;
        }

        var resolvedBusinessTypeId = RestaurantBusinessTypeId;

        foreach (var restaurant in uncategorizedRestaurants)
        {
            restaurant.BusinessTypeId = resolvedBusinessTypeId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task UpsertBusinessTypeAsync(
        AppDbContext dbContext,
        Guid id,
        string code,
        string name,
        string slug,
        string iconKey,
        int sortOrder,
        string description,
        CancellationToken cancellationToken)
    {
        var businessType = await dbContext.BusinessTypes.FirstOrDefaultAsync(x => x.Code == code, cancellationToken);

        if (businessType is null)
        {
            dbContext.BusinessTypes.Add(new BusinessType
            {
                Id = id,
                Code = code,
                Name = name,
                Slug = slug,
                IconKey = iconKey,
                SortOrder = sortOrder,
                Description = description,
                IsActive = true
            });

            return;
        }

        businessType.Name = name;
        businessType.Slug = slug;
        businessType.IconKey = iconKey;
        businessType.SortOrder = sortOrder;
        businessType.Description = description;
        businessType.IsActive = true;
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

    private static string ResolveSeedPassword(IConfiguration configuration, string primaryKey)
    {
        var configuredPassword = configuration[primaryKey]
            ?? configuration["SeedUsers:DefaultPassword"];

        return string.IsNullOrWhiteSpace(configuredPassword)
            ? DefaultLocalSeedPassword
            : configuredPassword.Trim();
    }
}
