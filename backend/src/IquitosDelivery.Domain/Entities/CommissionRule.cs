using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class CommissionRule : BaseEntity
{
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public CommissionRuleScope Scope { get; set; }

    public CommissionValueType ValueType { get; set; }

    public decimal Value { get; set; }

    public decimal? MinAmount { get; set; }

    public decimal? MaxAmount { get; set; }

    public int Priority { get; set; }

    public bool IsEnabled { get; set; }

    public DateTime? EffectiveFromUtc { get; set; }

    public DateTime? EffectiveToUtc { get; set; }
}
