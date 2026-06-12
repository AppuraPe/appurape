namespace IquitosDelivery.Application.DTOs.Businesses;

public class BusinessCategorySectionResponse
{
    public BusinessTypeListItemResponse Category { get; set; } = new();

    public int TotalBusinesses { get; set; }

    public IReadOnlyList<BusinessListItemResponse> Businesses { get; set; } = Array.Empty<BusinessListItemResponse>();
}
