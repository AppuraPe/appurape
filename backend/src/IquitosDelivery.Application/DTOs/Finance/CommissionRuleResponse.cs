namespace IquitosDelivery.Application.DTOs.Finance;

public class CommissionRuleResponse
{
    public Guid Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Scope { get; set; } = string.Empty;

    public string ValueType { get; set; } = string.Empty;

    public decimal Value { get; set; }

    public decimal? MinAmount { get; set; }

    public decimal? MaxAmount { get; set; }

    public int Priority { get; set; }

    public bool IsEnabled { get; set; }

    public DateTime? EffectiveFromUtc { get; set; }

    public DateTime? EffectiveToUtc { get; set; }
}
