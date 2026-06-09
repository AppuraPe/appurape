using System.Text.Json;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Common;

public static class FinancialCalculator
{
    public static CommercialFinancialBreakdown CalculateCommercialOrder(
        decimal subtotal,
        decimal deliveryFee,
        IReadOnlyCollection<CommissionRule> rules)
    {
        var businessCommission = ApplyRule(GetRule(rules, FinancialRuleCodes.CommercialBusinessCommission), subtotal);
        var deliveryPlatformCommission = Clamp(ApplyRule(GetRule(rules, FinancialRuleCodes.CommercialDeliveryPlatformCommission), deliveryFee), 0m, deliveryFee);
        var serviceFee = ApplyRule(GetRule(rules, FinancialRuleCodes.CommercialServiceFee), subtotal);
        var discount = 0m;
        var businessNetAmount = Math.Max(0m, subtotal - businessCommission);
        var courierEarning = Math.Max(0m, deliveryFee - deliveryPlatformCommission);
        var platformRevenue = businessCommission + deliveryPlatformCommission + serviceFee - discount;
        var total = subtotal + deliveryFee + serviceFee - discount;

        return new CommercialFinancialBreakdown(
            subtotal,
            businessCommission,
            businessNetAmount,
            deliveryFee,
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
        var favorPlatformCommission = Clamp(
            ApplyRule(GetRule(rules, FinancialRuleCodes.CommunityFavorPlatformCommission), compensationAmount),
            0m,
            compensationAmount);
        var collaboratorEarning = Math.Max(0m, compensationAmount - favorPlatformCommission);
        var totalClientAmount = compensationAmount + estimatedPurchaseAmount;

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
            breakdown.DeliveryFee,
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
}

public sealed record CommercialFinancialBreakdown(
    decimal Subtotal,
    decimal BusinessCommissionAmount,
    decimal BusinessNetAmount,
    decimal DeliveryFee,
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
