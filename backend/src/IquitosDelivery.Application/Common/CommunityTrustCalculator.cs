using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Common;

public static class CommunityTrustCalculator
{
    public static decimal CalculateScore(
        int completedCollaborations,
        decimal averageRating,
        decimal acceptanceRate,
        DateTime memberSinceUtc)
    {
        var completionComponent = Math.Min(completedCollaborations, 25) * 2.4m;
        var ratingComponent = averageRating * 10m;
        var acceptanceComponent = Math.Min(acceptanceRate, 100m) * 0.2m;
        var seniorityMonths = Math.Max(0, ((DateTime.UtcNow.Year - memberSinceUtc.Year) * 12) + DateTime.UtcNow.Month - memberSinceUtc.Month);
        var seniorityComponent = Math.Min(seniorityMonths, 12);

        return Math.Min(100m, completionComponent + ratingComponent + acceptanceComponent + seniorityComponent);
    }

    public static CommunityCollaborationLevel CalculateLevel(decimal score, int completedCollaborations)
    {
        if (score >= 90m && completedCollaborations >= 100)
        {
            return CommunityCollaborationLevel.TopCollaborator;
        }

        if (score >= 70m && completedCollaborations >= 10)
        {
            return CommunityCollaborationLevel.Trusted;
        }

        return CommunityCollaborationLevel.Verified;
    }
}
