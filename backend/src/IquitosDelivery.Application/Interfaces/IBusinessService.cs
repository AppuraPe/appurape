namespace IquitosDelivery.Application.Interfaces;

public interface IBusinessService
{
    Task<IReadOnlyList<BusinessListItemResponse>> GetPublicBusinessesAsync(
        PublicBusinessFilterRequest filters,
        CancellationToken cancellationToken = default);

    Task<IquitosDelivery.Application.DTOs.Businesses.PublicBusinessMobileHomeResponse> GetPublicBusinessMobileHomeAsync(
        CancellationToken cancellationToken = default);

    Task<BusinessDetailResponse> GetPublicBusinessDetailAsync(Guid businessId, CancellationToken cancellationToken = default);

    Task<MyBusinessResponse> GetMyBusinessAsync(CancellationToken cancellationToken = default);

    Task<MyBusinessResponse> UpdateMyBusinessAsync(UpdateMyBusinessRequest request, CancellationToken cancellationToken = default);

    Task<MyBusinessResponse> UpdateMyBusinessActivationAsync(UpdateBusinessActivationRequest request, CancellationToken cancellationToken = default);
}
