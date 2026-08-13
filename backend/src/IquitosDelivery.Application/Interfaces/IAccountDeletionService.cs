using IquitosDelivery.Application.DTOs.Account;

namespace IquitosDelivery.Application.Interfaces;

public interface IAccountDeletionService
{
    Task StartAsync(StartAccountDeletionRequest request, CancellationToken cancellationToken = default);
    Task<AccountDeletionStatusResponse> ConfirmAsync(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken = default);
    Task<AccountDeletionStatusResponse> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<AccountDeletionStatusResponse> CancelAsync(CancellationToken cancellationToken = default);
    Task StartCancellationAsync(StartAccountDeletionRequest request, CancellationToken cancellationToken = default);
    Task<AccountDeletionStatusResponse> CancelWithCodeAsync(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken = default);
}
