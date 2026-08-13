using IquitosDelivery.Application.DTOs.Finance;

namespace IquitosDelivery.Application.Interfaces;

public interface ICollaboratorVerificationService
{
    Task<CollaboratorVerificationResponse> GetMineAsync(CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> RequestVerificationAsync(CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> SubmitVerificationAsync(string profilePhotoUrl, string identityDocumentPath, string liveSelfiePath, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CollaboratorVerificationResponse>> GetPendingAsync(CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> ApproveAsync(Guid verificationId, CancellationToken cancellationToken = default);

    Task<CollaboratorVerificationResponse> RejectAsync(Guid verificationId, RejectCollaboratorVerificationRequest request, CancellationToken cancellationToken = default);

    Task<string> GetPrivateEvidencePathAsync(Guid verificationId, string evidenceType, CancellationToken cancellationToken = default);
}
