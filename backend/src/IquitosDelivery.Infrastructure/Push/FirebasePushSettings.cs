namespace IquitosDelivery.Infrastructure.Push;

public class FirebasePushSettings
{
    public bool Enabled { get; set; }

    public string ProjectId { get; set; } = string.Empty;

    public string CredentialsPath { get; set; } = string.Empty;

    public string CredentialsJson { get; set; } = string.Empty;
}
