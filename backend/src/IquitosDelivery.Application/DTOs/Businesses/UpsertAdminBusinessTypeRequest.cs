namespace IquitosDelivery.Application.DTOs.Businesses;

public class UpsertAdminBusinessTypeRequest
{
    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? IconKey { get; set; }

    public int SortOrder { get; set; }
}
