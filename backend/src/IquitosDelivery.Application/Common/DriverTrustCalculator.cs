using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Common;

public static class DriverTrustCalculator
{
    public static decimal CalculateScore(int completedDeliveriesCount, decimal? averageRating)
    {
        var deliveryComponent = Math.Min(completedDeliveriesCount, 10) * 6m;
        var ratingComponent = averageRating.HasValue ? averageRating.Value * 8m : 0m;
        return Math.Min(100m, deliveryComponent + ratingComponent);
    }

    public static TrustLevel CalculateLevel(decimal trustScore)
    {
        return trustScore >= 70m ? TrustLevel.Trusted : TrustLevel.Verified;
    }
}
