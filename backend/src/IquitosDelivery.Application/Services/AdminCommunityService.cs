using IquitosDelivery.Application.DTOs.Community;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class AdminCommunityService : IAdminCommunityService
{
    private readonly IAppDbContext _dbContext;

    public AdminCommunityService(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CommunityAdminOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var collaborators = await _dbContext.CommunityCollaborators
            .Include(x => x.User)
            .ToListAsync(cancellationToken);
        var requests = await _dbContext.CommunityRequests
            .Include(x => x.AssignedCollaborator)
                .ThenInclude(x => x!.User)
            .ToListAsync(cancellationToken);

        var deliveredCount = requests.Count(x => x.Status == CommunityRequestStatus.Delivered);
        var cancelledCount = requests.Count(x => x.Status == CommunityRequestStatus.Cancelled);
        var resolvedCount = deliveredCount + cancelledCount;

        return new CommunityAdminOverviewResponse
        {
            ActiveCollaboratorsCount = collaborators.Count(x => x.User.Status == UserStatus.Active),
            AvailableCollaboratorsCount = collaborators.Count(x => x.IsAvailable && x.AvailabilityStatus == CommunityAvailabilityStatus.Available),
            PublishedRequestsCount = requests.Count(x => x.Status == CommunityRequestStatus.Published || x.Status == CommunityRequestStatus.Searching),
            AcceptedRequestsCount = requests.Count(x => x.Status == CommunityRequestStatus.Accepted),
            InProcessRequestsCount = requests.Count(x => x.Status == CommunityRequestStatus.InProcess),
            DeliveredRequestsCount = deliveredCount,
            CancelledRequestsCount = cancelledCount,
            SuccessRate = resolvedCount == 0 ? 0m : Math.Round((decimal)deliveredCount / resolvedCount * 100m, 2),
            AverageTrustScore = collaborators.Count == 0 ? 0m : Math.Round(collaborators.Average(x => x.TrustScore), 2),
            TopCollaborators = collaborators
                .OrderByDescending(x => x.TrustScore)
                .ThenByDescending(x => x.CompletedCollaborations)
                .Take(5)
                .Select(x => new CommunityAdminCollaboratorRankingResponse
                {
                    CollaboratorId = x.Id,
                    FullName = $"{x.User.FirstName} {x.User.LastName}".Trim(),
                    Email = x.User.Email,
                    AvailabilityStatus = x.AvailabilityStatus.ToString(),
                    CollaborationLevel = x.CollaborationLevel.ToString(),
                    TrustScore = x.TrustScore,
                    CollaborationRating = x.CollaborationRating,
                    CompletedCollaborations = x.CompletedCollaborations,
                    MatchScore = x.TrustScore
                })
                .ToList()
        };
    }

    public async Task<IReadOnlyList<CommunityCollaboratorResponse>> GetCollaboratorsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.CommunityCollaborators
            .Include(x => x.User)
            .OrderByDescending(x => x.TrustScore)
            .ThenByDescending(x => x.CompletedCollaborations)
            .Select(x => new CommunityCollaboratorResponse
            {
                Id = x.Id,
                UserId = x.UserId,
                FullName = x.User.FirstName + " " + x.User.LastName,
                Email = x.User.Email,
                Phone = x.User.Phone,
                IsAvailable = x.IsAvailable,
                AvailabilityStatus = x.AvailabilityStatus.ToString(),
                CurrentLatitude = x.CurrentLatitude,
                CurrentLongitude = x.CurrentLongitude,
                AvailabilityRadiusKm = x.AvailabilityRadiusKm,
                AvailableFromUtc = x.AvailableFromUtc,
                AvailableUntilUtc = x.AvailableUntilUtc,
                TrustScore = x.TrustScore,
                CompletedCollaborations = x.CompletedCollaborations,
                CollaborationRating = x.CollaborationRating,
                CommunityAcceptanceRate = x.CommunityAcceptanceRate,
                CommunityCancellationRate = x.CommunityCancellationRate,
                CollaborationLevel = x.CollaborationLevel.ToString(),
                UserStatus = x.User.Status.ToString()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CommunityRequestListItemResponse>> GetRequestsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.CommunityRequests
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new CommunityRequestListItemResponse
            {
                Id = x.Id,
                CreatedByUserId = x.CreatedByUserId,
                CreatedByFullName = x.CreatedByUser.FirstName + " " + x.CreatedByUser.LastName,
                Type = x.Type.ToString(),
                Title = x.Title,
                OriginLabel = x.OriginLabel,
                DestinationLabel = x.DestinationLabel,
                CompensationAmount = x.CompensationAmount,
                DeadlineUtc = x.DeadlineUtc,
                Status = x.Status.ToString(),
                IsMine = false,
                IsAssignedToMe = false,
                MatchScore = x.MatchScore,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }
}
