using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Infrastructure.Persistence;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string ApiProjectUserSecretsId = "IquitosDelivery.Api-EmailProviders";

    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connectionString = ResolveConnectionString();

        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }

    private static string ResolveConnectionString()
    {
        var apiProjectPath = ResolveApiProjectPath();
        var configurationBuilder = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: false);

        var userSecretsPath = ResolveUserSecretsPath();
        if (!string.IsNullOrWhiteSpace(userSecretsPath))
        {
            configurationBuilder.AddJsonFile(userSecretsPath, optional: true, reloadOnChange: false);
        }

        var configuration = configurationBuilder
            .AddEnvironmentVariables()
            .Build();

        return ConnectionStringResolver.ResolveForRuntime(configuration);
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        return Path.GetFullPath(Path.Combine(currentDirectory, "..", "IquitosDelivery.Api"));
    }

    private static string? ResolveUserSecretsPath()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        if (string.IsNullOrWhiteSpace(appData))
        {
            return null;
        }

        return Path.Combine(appData, "Microsoft", "UserSecrets", ApiProjectUserSecretsId, "secrets.json");
    }
}
