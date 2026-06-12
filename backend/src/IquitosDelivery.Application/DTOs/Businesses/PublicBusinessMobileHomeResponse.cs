namespace IquitosDelivery.Application.DTOs.Businesses;

public class PublicBusinessMobileHomeResponse
{
    public IReadOnlyList<BusinessTypeListItemResponse> Categories { get; set; } = Array.Empty<BusinessTypeListItemResponse>();

    public IReadOnlyList<BusinessTypeListItemResponse> PopularCategories { get; set; } = Array.Empty<BusinessTypeListItemResponse>();

    public IReadOnlyList<BusinessCategorySectionResponse> Sections { get; set; } = Array.Empty<BusinessCategorySectionResponse>();
}
