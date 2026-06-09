namespace IquitosDelivery.Infrastructure.Storage;

public class StorageSettings
{
    public string Provider { get; set; } = string.Empty;

    public string PublicBaseUrl { get; set; } = string.Empty;

    public SupabaseStorageSettings Supabase { get; set; } = new();
}

public class SupabaseStorageSettings
{
    public string Url { get; set; } = string.Empty;

    public string ServiceKey { get; set; } = string.Empty;

    public string Bucket { get; set; } = "appurape";
}
