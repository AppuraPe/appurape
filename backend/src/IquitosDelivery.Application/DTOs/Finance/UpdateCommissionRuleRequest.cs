namespace IquitosDelivery.Application.DTOs.Finance;

public class UpdateCommissionRuleRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Value { get; set; }

    public decimal? MinAmount { get; set; }

    public decimal? MaxAmount { get; set; }

    public int Priority { get; set; }

    public bool IsEnabled { get; set; }

    public DateTime? EffectiveFromUtc { get; set; }

    public DateTime? EffectiveToUtc { get; set; }
}
