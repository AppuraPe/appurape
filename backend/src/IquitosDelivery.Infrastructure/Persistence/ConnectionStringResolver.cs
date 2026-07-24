using Microsoft.Extensions.Configuration;
using Npgsql;

namespace IquitosDelivery.Infrastructure.Persistence;

internal static class ConnectionStringResolver
{
    private const string PlaceholderValue = "__SET_VIA_USER_SECRETS_OR_ENV__";

    public static string ResolveForRuntime(IConfiguration configuration)
    {
        var rawConnectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? configuration["ConnectionStrings:DefaultConnection"]
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? Environment.GetEnvironmentVariable("RENDER_DATABASE_CONNECTION_STRING")
            ?? Environment.GetEnvironmentVariable("EXTERNAL_DATABASE_URL");

        if (string.IsNullOrWhiteSpace(rawConnectionString) || string.Equals(rawConnectionString, PlaceholderValue, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' was not found. " +
                "Set ConnectionStrings__DefaultConnection or a supported DATABASE_URL-style variable in the hosting environment.");
        }

        return Normalize(rawConnectionString);
    }

    public static string Normalize(string rawConnectionString)
    {
        if (string.IsNullOrWhiteSpace(rawConnectionString))
        {
            return rawConnectionString;
        }

        if (!rawConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) &&
            !rawConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        {
            return rawConnectionString;
        }

        var uri = new Uri(rawConnectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
        var database = uri.AbsolutePath.Trim('/');

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = username,
            Password = password,
            Database = string.IsNullOrWhiteSpace(database) ? "postgres" : database
        };

        var query = uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var pair in query)
        {
            var parts = pair.Split('=', 2);
            if (parts.Length != 2)
            {
                continue;
            }

            var key = Uri.UnescapeDataString(parts[0]);
            var value = Uri.UnescapeDataString(parts[1]);

            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
            {
                builder.SslMode = Enum.TryParse<SslMode>(value, true, out var sslMode)
                    ? sslMode
                    : SslMode.Require;
            }
        }

        return builder.ConnectionString;
    }
}
