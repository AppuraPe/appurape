using IquitosDelivery.Application.DTOs.CustomerAddresses;

namespace IquitosDelivery.Application.Interfaces;

public interface ICustomerAddressService
{
    Task<IReadOnlyList<CustomerAddressResponse>> GetMyAddressesAsync(CancellationToken cancellationToken = default);

    Task<CustomerAddressResponse> GetMyAddressByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<CustomerAddressResponse> CreateMyAddressAsync(UpsertCustomerAddressRequest request, CancellationToken cancellationToken = default);

    Task<CustomerAddressResponse> UpdateMyAddressAsync(Guid id, UpsertCustomerAddressRequest request, CancellationToken cancellationToken = default);

    Task DeleteMyAddressAsync(Guid id, CancellationToken cancellationToken = default);

    Task<CustomerAddressResponse> SetDefaultAsync(Guid id, CancellationToken cancellationToken = default);
}
