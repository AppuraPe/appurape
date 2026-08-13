using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace IquitosDelivery.Infrastructure.Persistence;

public static class AppDbContextSeeder
{
    private const string AdminEmail = "admin@iquitosdelivery.local";
    private const string DefaultLocalSeedPassword = "ChangeMe.LocalOnly.123!";
    private const string DevelopmentQaCustomerEmail = "client.customer.1778016513@appurape.dev";
    private const string DevelopmentQaBusinessEmail = "client.rest.1778016513@appurape.dev";
    private const string DevelopmentQaDriverEmail = "client.driver.1778016513@appurape.dev";
    private const string ResetExistingSeedPasswordsKey = "SeedUsers:ResetExistingPasswords";
    private static readonly Guid RestaurantBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F15");
    private static readonly Guid HardwareBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F16");
    private static readonly Guid GroceryBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F17");
    private static readonly Guid PharmacyBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F18");
    private static readonly Guid ClothingBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F19");
    private static readonly Guid CommercialBusinessCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F101");
    private static readonly Guid CommercialDeliveryCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F102");
    private static readonly Guid CommercialServiceFeeRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F103");
    private static readonly Guid CommunityFavorCommissionRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F104");
    private static readonly Guid VerifiedDriverDeliveryUnder20RuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F105");
    private static readonly Guid VerifiedDriverDeliveryFrom20RuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F106");
    private static readonly Guid SimpleFavorMinimumRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F107");
    private static readonly Guid CollaboratorVerificationFeeRuleId = Guid.Parse("840B73AB-9D8E-4A51-B95E-34A8F3A4F108");

    public static async Task SeedBaseDataAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        await SeedZonesAsync(dbContext, cancellationToken);
        await SeedBusinessTypesAsync(dbContext, cancellationToken);
        await SeedCommissionRulesAsync(dbContext, cancellationToken);
        await SeedLegalDraftsAsync(dbContext, cancellationToken);
        await SeedAdminAsync(dbContext, passwordHasher, configuration, cancellationToken);
    }

    private static async Task SeedLegalDraftsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var settings = await dbContext.PlatformSettings.FirstOrDefaultAsync(x => x.Key == "default", cancellationToken);
        if (settings is null)
        {
            settings = new PlatformSettings { Id = Guid.NewGuid(), Key = "default", AppName = "AppuraPe", Tagline = "Entrega local para negocios y comunidad", PrimaryColor = "#E51B23", SecondaryColor = "#F59E0B" };
            dbContext.PlatformSettings.Add(settings);
        }
        if (await dbContext.LegalDocuments.AnyAsync(cancellationToken)) return;
        var drafts = new[]
        {
            ("PrivacyPolicy", "General", "privacy", "Política de privacidad", @"# Política de privacidad de AppuraPe

AppuraPe trata datos de identificación, contacto, direcciones, pedidos, pagos, datos del dispositivo y tokens de notificación para prestar, proteger y mejorar el servicio. Cuando una persona solicita ser colaboradora también tratamos su foto de perfil, DNI y selfie en vivo exclusivamente para verificar identidad y prevenir fraude.

Los datos pueden ser procesados por proveedores de infraestructura y comunicaciones como Render, Supabase, Firebase y Brevo bajo instrucciones de AppuraPe. No vendemos datos personales. Aplicamos controles de acceso, cifrado en tránsito y almacenamiento privado para evidencias de identidad.

La información se conserva mientras la cuenta esté activa y durante los plazos necesarios por seguridad, atención de reclamos y obligaciones legales. La persona puede solicitar acceso, rectificación, oposición o eliminación escribiendo al correo de privacidad configurado en AppuraPe. La eliminación de cuenta tiene un plazo reversible de siete días; después se eliminan o anonimizan los datos, conservando únicamente registros transaccionales exigibles sin identificación directa.

Este documento es un borrador operativo y debe ser revisado legalmente antes de publicarse."),
            ("TermsOfService", "General", "terms", "Términos y condiciones", @"# Términos y condiciones de AppuraPe

AppuraPe conecta clientes, negocios, repartidores y colaboradores. Cada persona debe proporcionar información veraz, proteger su cuenta y utilizar la plataforma de manera lícita. Las operaciones, cancelaciones, pagos y responsabilidades se rigen por las reglas visibles antes de confirmar cada servicio.

AppuraPe puede suspender cuentas ante fraude, suplantación, abuso o incumplimiento. Las notificaciones son opcionales y sirven para informar cambios operativos. Estos términos no sustituyen las condiciones específicas de cada rol.

Este documento es un borrador operativo y debe ser revisado legalmente antes de publicarse."),
            ("CustomerTerms", "Customer", "customer-terms", "Condiciones para clientes", @"# Condiciones para clientes

El cliente debe revisar negocio, productos, dirección, total y modalidad de entrega antes de confirmar. Debe mantener datos de contacto correctos y atender la recepción del pedido o favor. Si decide colaborar en Favores deberá completar una verificación de identidad adicional y esperar aprobación administrativa.

Este documento es un borrador operativo y debe ser revisado legalmente antes de publicarse."),
            ("BusinessTerms", "Restaurant", "business-terms", "Condiciones para negocios", @"# Condiciones para negocios

El negocio es responsable de la veracidad de su catálogo, precios, disponibilidad, preparación, inocuidad y atención de pedidos. Debe mantener actualizados sus datos y cumplir las comisiones y liquidaciones informadas en su panel.

Este documento es un borrador operativo y debe ser revisado legalmente antes de publicarse."),
            ("DriverTerms", "Driver", "driver-terms", "Condiciones para repartidores", @"# Condiciones para repartidores

El repartidor debe mantener vigentes sus documentos, conducir de forma segura, proteger los pedidos y completar únicamente entregas realmente realizadas. La disponibilidad es voluntaria y las ganancias se muestran antes de aceptar cuando estén disponibles.

Este documento es un borrador operativo y debe ser revisado legalmente antes de publicarse."),
            ("CollaboratorIdentityConsent", "Collaborator", "collaborator-identity-consent", "Consentimiento para verificar identidad", @"# Consentimiento para verificación de colaborador

Autorizo a AppuraPe a recibir y comparar mi foto de perfil, fotografía de DNI y selfie tomada en vivo para verificar mi identidad, prevenir suplantaciones y evaluar mi solicitud como colaborador. Comprendo que DNI y selfie se almacenan de forma privada, solo pueden ser revisados por personal administrador autorizado y se eliminan o anonimizan conforme a la política de conservación.

Este consentimiento es independiente y debe aceptarse antes de enviar las evidencias.")
        };
        foreach (var (type, audience, slug, title, content) in drafts)
        {
            dbContext.LegalDocuments.Add(new LegalDocument
            {
                Id = Guid.NewGuid(), Type = type, Audience = audience, Slug = slug, Version = "1.0-draft",
                Title = title, ContentMarkdown = content, ContentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content))),
                Status = LegalDocumentStatus.Draft
            });
        }
        await dbContext.SaveChangesAsync(cancellationToken);
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
        var shouldResetPassword = ShouldResetExistingSeedPasswords(configuration);
        await UpsertDevelopmentCustomerAsync(dbContext, passwordHasher, qaPassword, shouldResetPassword, cancellationToken);
        await UpsertDevelopmentBusinessAsync(dbContext, passwordHasher, qaPassword, shouldResetPassword, belenZoneId, cancellationToken);
        await UpsertDevelopmentDriverAsync(dbContext, passwordHasher, qaPassword, shouldResetPassword, belenZoneId, cancellationToken);
    }

    private static async Task SeedAdminAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var adminPassword = ResolveSeedPassword(configuration, "SeedUsers:AdminPassword");
        var shouldResetPassword = ShouldResetExistingSeedPasswords(configuration);
        var normalizedEmail = AdminEmail.ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (user is not null)
        {
            user.FirstName = "System";
            user.LastName = "Admin";
            user.Phone = "000000000";
            user.Role = UserRole.Admin;
            user.Status = UserStatus.Active;
            if (shouldResetPassword)
            {
                user.PasswordHash = passwordHasher.Hash(adminPassword);
            }

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
        bool shouldResetPassword,
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
        if (shouldResetPassword)
        {
            user.PasswordHash = passwordHasher.Hash(qaPassword);
        }

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
        bool shouldResetPassword,
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
        if (shouldResetPassword)
        {
            user.PasswordHash = passwordHasher.Hash(qaPassword);
        }

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
        bool shouldResetPassword,
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
        if (shouldResetPassword)
        {
            user.PasswordHash = passwordHasher.Hash(qaPassword);
        }

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
            10m,
            10,
            true,
            cancellationToken);
        await SetCommissionRuleMinimumAsync(dbContext, FinancialRuleCodes.CommercialBusinessCommission, 1m, cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CommercialDeliveryCommissionRuleId,
            FinancialRuleCodes.CommercialDeliveryPlatformCommission,
            "Commercial delivery platform commission",
            "MVP keeps delivery outside percentage commission.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.Percentage,
            0m,
            20,
            false,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CommercialServiceFeeRuleId,
            FinancialRuleCodes.CommercialServiceFee,
            "Commercial service fee",
            "Visible AppuraPe service fee charged to the customer.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.FlatAmount,
            1m,
            30,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            VerifiedDriverDeliveryUnder20RuleId,
            FinancialRuleCodes.VerifiedDriverDeliveryUnder20,
            "Verified driver delivery under S/ 20",
            "Minimum verified driver earning when product subtotal is under S/ 20.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.FlatAmount,
            4m,
            40,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            VerifiedDriverDeliveryFrom20RuleId,
            FinancialRuleCodes.VerifiedDriverDeliveryFrom20,
            "Verified driver delivery from S/ 20",
            "Minimum verified driver earning when product subtotal is S/ 20 or more.",
            CommissionRuleScope.CommercialOrder,
            CommissionValueType.FlatAmount,
            5m,
            50,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CommunityFavorCommissionRuleId,
            FinancialRuleCodes.CommunityFavorPlatformCommission,
            "Community favor platform commission",
            "Visible AppuraPe service fee charged on community favors.",
            CommissionRuleScope.CommunityRequest,
            CommissionValueType.FlatAmount,
            1m,
            10,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            SimpleFavorMinimumRuleId,
            FinancialRuleCodes.SimpleFavorMinimum,
            "Simple favor minimum collaborator pay",
            "Minimum collaborator earning for a simple community favor.",
            CommissionRuleScope.CommunityRequest,
            CommissionValueType.FlatAmount,
            2m,
            20,
            true,
            cancellationToken);

        await UpsertCommissionRuleAsync(
            dbContext,
            CollaboratorVerificationFeeRuleId,
            FinancialRuleCodes.CollaboratorVerificationFee,
            "Collaborator verification fee",
            "One-time AppuraPe collaborator verification fee.",
            CommissionRuleScope.CommunityRequest,
            CommissionValueType.FlatAmount,
            5m,
            30,
            true,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SetCommissionRuleMinimumAsync(
        AppDbContext dbContext,
        string code,
        decimal minAmount,
        CancellationToken cancellationToken)
    {
        var rule = await dbContext.CommissionRules.FirstOrDefaultAsync(x => x.Code == code, cancellationToken);
        if (rule is not null)
        {
            rule.MinAmount = minAmount;
        }
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

    private static bool ShouldResetExistingSeedPasswords(IConfiguration configuration)
    {
        return bool.TryParse(configuration[ResetExistingSeedPasswordsKey], out var shouldReset) && shouldReset;
    }

}
