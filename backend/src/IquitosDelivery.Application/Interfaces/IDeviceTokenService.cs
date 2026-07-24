using IquitosDelivery.Application.DTOs.Notifications;

namespace IquitosDelivery.Application.Interfaces;

public interface IDeviceTokenService
{
    Task RegisterAsync(RegisterDeviceTokenRequest request, CancellationToken cancellationToken = default);

    Task DeactivateAsync(DeactivateDeviceTokenRequest request, CancellationToken cancellationToken = default);
}
