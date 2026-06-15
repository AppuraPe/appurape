namespace IquitosDelivery.Application.DTOs.Businesses;

public class AdminBusinessTypeResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? IconKey { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public int BusinessCount { get; set; }
}
