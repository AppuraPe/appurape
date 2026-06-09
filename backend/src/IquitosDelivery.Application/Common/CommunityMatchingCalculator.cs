using IquitosDelivery.Application.DTOs.Community;
using IquitosDelivery.Domain.Entities;

namespace IquitosDelivery.Application.Common;

public static class CommunityMatchingCalculator
{
    public static CommunityRequestMatchResponse BuildMatch(
        CommunityCollaborator collaborator,
        CommunityRequest request,
        CommunityRoute? matchedRoute)
    {
        var distanceKm = CalculateDistanceKm(
            collaborator.CurrentLatitude ?? matchedRoute?.OriginLatitude,
            collaborator.CurrentLongitude ?? matchedRoute?.OriginLongitude,
            request.OriginLatitude,
            request.OriginLongitude);

        var proximityScore = distanceKm <= 0 ? 1m : Math.Max(0m, 1m - (distanceKm / Math.Max(1m, collaborator.AvailabilityRadiusKm)));
        var reputationScore = collaborator.TrustScore / 100m;
        var historyScore = Math.Max(0m, (collaborator.CommunityAcceptanceRate - collaborator.CommunityCancellationRate) / 100m);
        var estimatedMinutes = EstimateMinutes(distanceKm, matchedRoute?.EstimatedMinutes);
        var timeScore = Math.Max(0m, 1m - (estimatedMinutes / 120m));
        var routeBonus = matchedRoute is null ? 0m : 0.15m;
        var finalScore = Math.Min(100m, ((proximityScore * 0.4m) + (reputationScore * 0.3m) + (historyScore * 0.2m) + (timeScore * 0.1m) + routeBonus) * 100m);

        return new CommunityRequestMatchResponse
        {
            CollaboratorId = collaborator.Id,
            FullName = $"{collaborator.User.FirstName} {collaborator.User.LastName}".Trim(),
            AvailabilityStatus = collaborator.AvailabilityStatus.ToString(),
            IsAvailable = collaborator.IsAvailable,
            CurrentLatitude = collaborator.CurrentLatitude,
            CurrentLongitude = collaborator.CurrentLongitude,
            AvailabilityRadiusKm = collaborator.AvailabilityRadiusKm,
            TrustScore = collaborator.TrustScore,
            CompletedCollaborations = collaborator.CompletedCollaborations,
            CollaborationRating = collaborator.CollaborationRating,
            CommunityAcceptanceRate = collaborator.CommunityAcceptanceRate,
            CommunityCancellationRate = collaborator.CommunityCancellationRate,
            CollaborationLevel = collaborator.CollaborationLevel.ToString(),
            HasRouteMatch = matchedRoute is not null,
            DistanceKm = Math.Round(distanceKm, 2),
            EstimatedMinutes = estimatedMinutes,
            MatchScore = Math.Round(finalScore, 2)
        };
    }

    public static bool IsRouteCompatible(CommunityRoute route, CommunityRequest request)
    {
        var originDistance = CalculateDistanceKm(route.OriginLatitude, route.OriginLongitude, request.OriginLatitude, request.OriginLongitude);
        var destinationDistance = CalculateDistanceKm(route.DestinationLatitude, route.DestinationLongitude, request.DestinationLatitude, request.DestinationLongitude);

        return originDistance <= route.DeviationRadiusKm && destinationDistance <= route.DeviationRadiusKm;
    }

    public static decimal CalculateDistanceKm(decimal? fromLatitude, decimal? fromLongitude, decimal? toLatitude, decimal? toLongitude)
    {
        if (!fromLatitude.HasValue || !fromLongitude.HasValue || !toLatitude.HasValue || !toLongitude.HasValue)
        {
            return 999m;
        }

        const double earthRadiusKm = 6371d;
        var dLat = DegreesToRadians((double)(toLatitude.Value - fromLatitude.Value));
        var dLon = DegreesToRadians((double)(toLongitude.Value - fromLongitude.Value));
        var lat1 = DegreesToRadians((double)fromLatitude.Value);
        var lat2 = DegreesToRadians((double)toLatitude.Value);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(lat1) * Math.Cos(lat2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return (decimal)(earthRadiusKm * c);
    }

    private static int EstimateMinutes(decimal distanceKm, int? routeMinutes)
    {
        if (routeMinutes.HasValue)
        {
            return routeMinutes.Value;
        }

        return Math.Max(5, (int)Math.Round(distanceKm * 6m, MidpointRounding.AwayFromZero));
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * (Math.PI / 180d);
    }
}
