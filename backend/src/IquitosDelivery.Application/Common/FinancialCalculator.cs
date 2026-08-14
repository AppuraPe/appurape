using System.Text.Json;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Common;

public static class FinancialCalculator
{
    public static CommercialFinancialBreakdown CalculateCommercialOrder(
        decimal subtotal,
        DeliveryMode deliveryMode,
        decimal? offeredDeliveryAmount,
        bool businessHasOwnDelivery,
        decimal? businessOwnDeliveryFee,
        IReadOnlyCollection<CommissionRule> rules)
    {
        var businessCommission = Clamp(ApplyRule(GetRule(rules, FinancialRuleCodes.CommercialBusinessCommission), subtotal), 0m, subtotal);
        var deliveryMinimumAmount = ResolveDeliveryMinimum(subtotal, deliveryMode, businessHasOwnDelivery, businessOwnDeliveryFee, rules);
        var deliveryFee = ResolveDeliveryFee(deliveryMode, offeredDeliveryAmount, deliveryMinimumAmount);
        var deliveryPlatformCommission = Clamp(ApplyRule(GetRule(rules, FinancialRuleCodes.CommercialDeliveryPlatformCommission), deliveryFee), 0m, deliveryFee);
        var serviceFee = ApplyRule(GetRule(rules, FinancialRuleCodes.CommercialServiceFee), subtotal);
        var discount = 0m;
        var businessNetAmount = Math.Max(0m, subtotal - businessCommission);
        var courierEarning = Math.Max(0m, deliveryFee - deliveryPlatformCommission);
        var platformRevenue = businessCommission + deliveryPlatformCommission + serviceFee - discount;
        var total = subtotal + deliveryFee + serviceFee - discount;
        EnsureInvariant(total, businessNetAmount + courierEarning + platformRevenue, "commercial order");

        return new CommercialFinancialBreakdown(
            subtotal,
            businessCommission,
            businessNetAmount,
            deliveryMode,
            deliveryFee,
            deliveryMinimumAmount,
            deliveryPlatformCommission,
            courierEarning,
            serviceFee,
            discount,
            total,
            platformRevenue);
    }

    public static CommunityFinancialBreakdown CalculateCommunityRequest(
        decimal compensationAmount,
        decimal estimatedPurchaseAmount,
        IReadOnlyCollection<CommissionRule> rules)
    {
        var favorPlatformCommission = ApplyRule(GetRule(rules, FinancialRuleCodes.CommunityFavorPlatformCommission), compensationAmount);
        var collaboratorEarning = Math.Max(0m, compensationAmount);
        var totalClientAmount = compensationAmount + estimatedPurchaseAmount + favorPlatformCommission;
        EnsureInvariant(totalClientAmount, collaboratorEarning + estimatedPurchaseAmount + favorPlatformCommission, "community request");

        return new CommunityFinancialBreakdown(
            compensationAmount,
            estimatedPurchaseAmount,
            favorPlatformCommission,
            collaboratorEarning,
            totalClientAmount,
            favorPlatformCommission);
    }

    public static string SerializeCommercialSnapshot(CommercialFinancialBreakdown breakdown, IReadOnlyCollection<CommissionRule> rules)
    {
        return JsonSerializer.Serialize(new
        {
            breakdown.Subtotal,
            breakdown.BusinessCommissionAmount,
            breakdown.BusinessNetAmount,
            DeliveryMode = breakdown.DeliveryMode.ToString(),
            breakdown.DeliveryFee,
            breakdown.DeliveryMinimumAmount,
            breakdown.DeliveryPlatformCommissionAmount,
            breakdown.CourierEarningAmount,
            breakdown.ServiceFeeAmount,
            breakdown.DiscountAmount,
            breakdown.Total,
            breakdown.PlatformRevenueAmount,
            Rules = rules.Select(MapRule).ToList()
        });
    }

    public static string SerializeCommunitySnapshot(CommunityFinancialBreakdown breakdown, IReadOnlyCollection<CommissionRule> rules)
    {
        return JsonSerializer.Serialize(new
        {
            breakdown.CompensationAmount,
            breakdown.EstimatedPurchaseAmount,
            breakdown.FavorPlatformCommissionAmount,
            breakdown.CollaboratorEarningAmount,
            breakdown.TotalClientAmount,
            breakdown.PlatformRevenueAmount,
            Rules = rules.Select(MapRule).ToList()
        });
    }

    private static object MapRule(CommissionRule rule) => new
    {
        rule.Id,
        rule.Code,
        rule.Name,
        Scope = rule.Scope.ToString(),
        ValueType = rule.ValueType.ToString(),
        rule.Value,
        rule.MinAmount,
        rule.MaxAmount,
        rule.Priority
    };

    private static CommissionRule? GetRule(IReadOnlyCollection<CommissionRule> rules, string code)
    {
        return rules.FirstOrDefault(x => x.Code == code && x.IsEnabled);
    }

    private static decimal ApplyRule(CommissionRule? rule, decimal baseAmount)
    {
        if (rule is null || baseAmount <= 0m)
        {
            return 0m;
        }

        var rawAmount = rule.ValueType == CommissionValueType.Percentage
            ? Math.Round(baseAmount * (rule.Value / 100m), 2, MidpointRounding.AwayFromZero)
            : Math.Round(rule.Value, 2, MidpointRounding.AwayFromZero);

        if (rule.MinAmount.HasValue && rawAmount < rule.MinAmount.Value)
        {
            rawAmount = rule.MinAmount.Value;
        }

        if (rule.MaxAmount.HasValue && rawAmount > rule.MaxAmount.Value)
        {
            rawAmount = rule.MaxAmount.Value;
        }

        return Math.Round(Math.Max(0m, rawAmount), 2, MidpointRounding.AwayFromZero);
    }

    private static decimal Clamp(decimal amount, decimal min, decimal max)
    {
        return Math.Min(max, Math.Max(min, amount));
    }

    private static void EnsureInvariant(decimal collected, decimal distributed, string context)
    {
        if (Math.Abs(RoundMoney(collected) - RoundMoney(distributed)) > 0.01m)
            throw new InvalidOperationException($"Financial invariant failed for {context}: collected and distributed amounts differ.");
    }

    private static decimal ResolveDeliveryMinimum(
        decimal subtotal,
        DeliveryMode deliveryMode,
        bool businessHasOwnDelivery,
        decimal? businessOwnDeliveryFee,
        IReadOnlyCollection<CommissionRule> rules)
    {
        return deliveryMode switch
        {
            DeliveryMode.PickupOrDirect => 0m,
            DeliveryMode.BusinessDelivery => businessHasOwnDelivery ? RoundMoney(businessOwnDeliveryFee ?? 0m) : 0m,
            DeliveryMode.VerifiedDriverDelivery => subtotal < 20m
                ? ApplyRule(GetRule(rules, FinancialRuleCodes.VerifiedDriverDeliveryUnder20), subtotal)
                : ApplyRule(GetRule(rules, FinancialRuleCodes.VerifiedDriverDeliveryFrom20), subtotal),
            _ => 0m
        };
    }

    private static decimal ResolveDeliveryFee(DeliveryMode deliveryMode, decimal? offeredDeliveryAmount, decimal deliveryMinimumAmount)
    {
        if (deliveryMode != DeliveryMode.VerifiedDriverDelivery)
        {
            return RoundMoney(deliveryMinimumAmount);
        }

        return RoundMoney(Math.Max(deliveryMinimumAmount, offeredDeliveryAmount ?? deliveryMinimumAmount));
    }

    private static decimal RoundMoney(decimal amount)
    {
        return Math.Round(Math.Max(0m, amount), 2, MidpointRounding.AwayFromZero);
    }
}

public sealed record CommercialFinancialBreakdown(
    decimal Subtotal,
    decimal BusinessCommissionAmount,
    decimal BusinessNetAmount,
    DeliveryMode DeliveryMode,
    decimal DeliveryFee,
    decimal DeliveryMinimumAmount,
    decimal DeliveryPlatformCommissionAmount,
    decimal CourierEarningAmount,
    decimal ServiceFeeAmount,
    decimal DiscountAmount,
    decimal Total,
    decimal PlatformRevenueAmount);

public sealed record CommunityFinancialBreakdown(
    decimal CompensationAmount,
    decimal EstimatedPurchaseAmount,
    decimal FavorPlatformCommissionAmount,
    decimal CollaboratorEarningAmount,
    decimal TotalClientAmount,
    decimal PlatformRevenueAmount);
