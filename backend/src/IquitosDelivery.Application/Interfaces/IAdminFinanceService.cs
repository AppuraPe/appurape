using IquitosDelivery.Application.DTOs.Finance;

namespace IquitosDelivery.Application.Interfaces;

public interface IAdminFinanceService
{
    Task<IReadOnlyList<CommissionRuleResponse>> GetCommissionRulesAsync(CancellationToken cancellationToken = default);

    Task<CommissionRuleResponse> UpdateCommissionRuleAsync(Guid ruleId, UpdateCommissionRuleRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FinancialMovementResponse>> GetFinancialMovementsAsync(FinancialMovementFilterRequest filters, CancellationToken cancellationToken = default);

    Task<AdminCommissionSummaryResponse> GetCommissionSummaryAsync(CancellationToken cancellationToken = default);

    Task<FinancialMovementResponse> WaiveMovementAsync(Guid movementId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SettlementBatchResponse>> GetSettlementsAsync(CancellationToken cancellationToken = default);

    Task<SettlementBatchResponse> GetSettlementByIdAsync(Guid settlementId, CancellationToken cancellationToken = default);

    Task<SettlementBatchResponse> CreateSettlementAsync(CreateSettlementBatchRequest request, CancellationToken cancellationToken = default);

    Task<SettlementBatchResponse> MarkSettlementPaidAsync(Guid settlementId, CancellationToken cancellationToken = default);

    Task<SettlementBatchResponse> CancelSettlementAsync(Guid settlementId, CancellationToken cancellationToken = default);
}
