using IquitosDelivery.Application.Common;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Tests;

public class InternalCommerceMvpPricingTests
{
    [Theory]
    [InlineData(12, 1.20)]
    [InlineData(8, 1.00)]
    [InlineData(25, 2.50)]
    public void CommercialOrder_Commission_IsTenPercentWithMinimum(decimal subtotal, decimal expectedCommission)
    {
        var result = FinancialCalculator.CalculateCommercialOrder(
            subtotal,
            DeliveryMode.PickupOrDirect,
            offeredDeliveryAmount: null,
            businessHasOwnDelivery: false,
            businessOwnDeliveryFee: null,
            BuildCommercialRules());

        Assert.Equal(expectedCommission, result.BusinessCommissionAmount);
        Assert.Equal(subtotal - expectedCommission, result.BusinessNetAmount);
        Assert.Equal(0m, result.DeliveryPlatformCommissionAmount);
    }

    [Fact]
    public void CommercialOrder_VerifiedDriverDelivery_Under20_RequiresFourSolesAndAddsServiceFee()
    {
        var result = FinancialCalculator.CalculateCommercialOrder(
            12m,
            DeliveryMode.VerifiedDriverDelivery,
            offeredDeliveryAmount: null,
            businessHasOwnDelivery: false,
            businessOwnDeliveryFee: null,
            BuildCommercialRules());

        Assert.Equal(4m, result.DeliveryMinimumAmount);
        Assert.Equal(4m, result.DeliveryFee);
        Assert.Equal(4m, result.CourierEarningAmount);
        Assert.Equal(1m, result.ServiceFeeAmount);
        Assert.Equal(17m, result.Total);
        Assert.Equal(2.20m, result.PlatformRevenueAmount);
    }

    [Fact]
    public void CommercialOrder_VerifiedDriverDelivery_From20_RequiresFiveSoles()
    {
        var result = FinancialCalculator.CalculateCommercialOrder(
            25m,
            DeliveryMode.VerifiedDriverDelivery,
            offeredDeliveryAmount: null,
            businessHasOwnDelivery: false,
            businessOwnDeliveryFee: null,
            BuildCommercialRules());

        Assert.Equal(5m, result.DeliveryMinimumAmount);
        Assert.Equal(5m, result.DeliveryFee);
        Assert.Equal(31m, result.Total);
        Assert.Equal(3.50m, result.PlatformRevenueAmount);
    }

    [Fact]
    public void CommercialOrder_VerifiedDriverDelivery_AllowsHigherOffer()
    {
        var result = FinancialCalculator.CalculateCommercialOrder(
            12m,
            DeliveryMode.VerifiedDriverDelivery,
            offeredDeliveryAmount: 6m,
            businessHasOwnDelivery: false,
            businessOwnDeliveryFee: null,
            BuildCommercialRules());

        Assert.Equal(4m, result.DeliveryMinimumAmount);
        Assert.Equal(6m, result.DeliveryFee);
        Assert.Equal(6m, result.CourierEarningAmount);
        Assert.Equal(19m, result.Total);
    }

    [Fact]
    public void CommercialOrder_BusinessDelivery_UsesBusinessFeeAndDoesNotChargeCommissionOnDelivery()
    {
        var result = FinancialCalculator.CalculateCommercialOrder(
            12m,
            DeliveryMode.BusinessDelivery,
            offeredDeliveryAmount: null,
            businessHasOwnDelivery: true,
            businessOwnDeliveryFee: 4m,
            BuildCommercialRules());

        Assert.Equal(4m, result.DeliveryFee);
        Assert.Equal(0m, result.DeliveryPlatformCommissionAmount);
        Assert.Equal(17m, result.Total);
        Assert.Equal(2.20m, result.PlatformRevenueAmount);
    }

    [Fact]
    public void CommercialOrder_PromoFivePercent_CanBeConfigured()
    {
        var rules = BuildCommercialRules(businessCommissionPercent: 5m, businessCommissionMinimum: null);

        var result = FinancialCalculator.CalculateCommercialOrder(
            20m,
            DeliveryMode.PickupOrDirect,
            offeredDeliveryAmount: null,
            businessHasOwnDelivery: false,
            businessOwnDeliveryFee: null,
            rules);

        Assert.Equal(1m, result.BusinessCommissionAmount);
    }

    [Fact]
    public void CommunityFavor_AddsOneSolServiceFeeAndKeepsCollaboratorReward()
    {
        var result = FinancialCalculator.CalculateCommunityRequest(
            compensationAmount: 2m,
            estimatedPurchaseAmount: 0m,
            BuildCommunityRules());

        Assert.Equal(2m, result.CollaboratorEarningAmount);
        Assert.Equal(1m, result.FavorPlatformCommissionAmount);
        Assert.Equal(3m, result.TotalClientAmount);
        Assert.Equal(1m, result.PlatformRevenueAmount);
    }

    private static List<CommissionRule> BuildCommercialRules(
        decimal businessCommissionPercent = 10m,
        decimal? businessCommissionMinimum = 1m)
    {
        return
        [
            new CommissionRule
            {
                Code = FinancialRuleCodes.CommercialBusinessCommission,
                Scope = CommissionRuleScope.CommercialOrder,
                ValueType = CommissionValueType.Percentage,
                Value = businessCommissionPercent,
                MinAmount = businessCommissionMinimum,
                IsEnabled = true
            },
            new CommissionRule
            {
                Code = FinancialRuleCodes.CommercialDeliveryPlatformCommission,
                Scope = CommissionRuleScope.CommercialOrder,
                ValueType = CommissionValueType.Percentage,
                Value = 0m,
                IsEnabled = false
            },
            new CommissionRule
            {
                Code = FinancialRuleCodes.CommercialServiceFee,
                Scope = CommissionRuleScope.CommercialOrder,
                ValueType = CommissionValueType.FlatAmount,
                Value = 1m,
                IsEnabled = true
            },
            new CommissionRule
            {
                Code = FinancialRuleCodes.VerifiedDriverDeliveryUnder20,
                Scope = CommissionRuleScope.CommercialOrder,
                ValueType = CommissionValueType.FlatAmount,
                Value = 4m,
                IsEnabled = true
            },
            new CommissionRule
            {
                Code = FinancialRuleCodes.VerifiedDriverDeliveryFrom20,
                Scope = CommissionRuleScope.CommercialOrder,
                ValueType = CommissionValueType.FlatAmount,
                Value = 5m,
                IsEnabled = true
            }
        ];
    }

    private static List<CommissionRule> BuildCommunityRules()
    {
        return
        [
            new CommissionRule
            {
                Code = FinancialRuleCodes.CommunityFavorPlatformCommission,
                Scope = CommissionRuleScope.CommunityRequest,
                ValueType = CommissionValueType.FlatAmount,
                Value = 1m,
                IsEnabled = true
            }
        ];
    }
}
