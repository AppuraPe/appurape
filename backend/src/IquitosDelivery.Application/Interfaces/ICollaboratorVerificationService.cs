using IquitosDelivery.Application.DTOs.Finance;

namespace IquitosDelivery.Application.Interfaces;

public interface ICollaboratorVerificationService
{
    Task<CollaboratorVerificationResponse> GetMineAsync(CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> RequestVerificationAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CollaboratorVerificationResponse>> GetPendingAsync(CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> ApproveAsync(Guid verificationId, CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> RejectAsync(Guid verificationId, RejectCollaboratorVerificationRequest request, CancellationToken cancellationToken = default);
}
