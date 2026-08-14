using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using IquitosDelivery.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Tests;

public class AppDbContextSeederTests
{
    [Fact]
    public async Task SeedBaseDataAsync_WithSecondaryAdminSecret_CreatesDistinctAdminIdempotently()
    {
        await using var dbContext = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SeedUsers:AdminPassword"] = "Primary.Admin.123!",
                ["SeedUsers:SecondaryAdminPassword"] = "Secondary.Admin.456!"
            })
            .Build();
        var passwordHasher = new PasswordHasher();

        await AppDbContextSeeder.SeedBaseDataAsync(dbContext, passwordHasher, configuration);
        await AppDbContextSeeder.SeedBaseDataAsync(dbContext, passwordHasher, configuration);

        var secondary = await dbContext.Users.SingleAsync(x => x.Email == "subadmin@appurape.local");
        Assert.Equal("Kin", secondary.FirstName);
        Assert.Equal("Huaya", secondary.LastName);
        Assert.Equal(UserRole.Admin, secondary.Role);
        Assert.Equal(UserStatus.Active, secondary.Status);
        Assert.True(passwordHasher.Verify("Secondary.Admin.456!", secondary.PasswordHash));
        Assert.Equal(2, await dbContext.Users.CountAsync(x => x.Role == UserRole.Admin));
    }

    [Fact]
    public async Task SeedBaseDataAsync_WithoutSecondaryAdminSecret_DoesNotCreateSecondaryAdmin()
    {
        await using var dbContext = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SeedUsers:AdminPassword"] = "Primary.Admin.123!"
            })
            .Build();

        await AppDbContextSeeder.SeedBaseDataAsync(dbContext, new PasswordHasher(), configuration);

        Assert.False(await dbContext.Users.AnyAsync(x => x.Email == "subadmin@appurape.local"));
    }
}
