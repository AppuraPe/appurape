using IquitosDelivery.Application.DTOs.Finance;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminFinanceService
{
    Task<IReadOnlyList<CommissionRuleResponse>> GetCommissionRulesAsync(CancellationToken cancellationToken = default);

    Task<CommissionRuleResponse> UpdateCommissionRuleAsync(Guid ruleId, UpdateCommissionRuleRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FinancialMovementResponse>> GetFinancialMovementsAsync(FinancialMovementFilterRequest filters, CancellationToken cancellationToken = default);
}
