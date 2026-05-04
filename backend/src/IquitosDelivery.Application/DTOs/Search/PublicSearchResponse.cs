namespace IquitosDelivery.Application.DTOs.Search;

public class PublicSearchResponse
{
    public string Query { get; set; } = string.Empty;

    public IReadOnlyList<PublicSearchFoodItemResponse> Foods { get; set; } = Array.Empty<PublicSearchFoodItemResponse>();

    public IReadOnlyList<PublicSearchRestaurantItemResponse> Restaurants { get; set; } = Array.Empty<PublicSearchRestaurantItemResponse>();
}
