using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IquitosDelivery.Infrastructure.Persistence;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string DefaultConnectionString =
        "Host=localhost;Port=5432;Database=iquitos_delivery_db;Username=postgres;Password=postgres";

    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connectionString = ResolveConnectionString();

        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }

    private static string ResolveConnectionString()
    {
        var environmentConnectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (!string.IsNullOrWhiteSpace(environmentConnectionString))
        {
            return environmentConnectionString;
        }

        var currentDirectory = Directory.GetCurrentDirectory();
        var apiAppSettingsPath = Path.GetFullPath(Path.Combine(currentDirectory, "..", "IquitosDelivery.Api", "appsettings.json"));

        if (!File.Exists(apiAppSettingsPath))
        {
            return DefaultConnectionString;
        }

        using var document = JsonDocument.Parse(File.ReadAllText(apiAppSettingsPath));

        if (document.RootElement.TryGetProperty("ConnectionStrings", out var connectionStrings) &&
            connectionStrings.TryGetProperty("DefaultConnection", out var defaultConnection) &&
            !string.IsNullOrWhiteSpace(defaultConnection.GetString()))
        {
            return defaultConnection.GetString()!;
        }

        return DefaultConnectionString;
    }
}
