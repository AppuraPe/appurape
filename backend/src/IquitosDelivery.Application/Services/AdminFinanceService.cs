using FluentValidation;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class AdminFinanceService : IAdminFinanceService
{
    private readonly IAppDbContext _dbContext;
    private readonly IValidator<UpdateCommissionRuleRequest> _updateCommissionRuleValidator;

    public AdminFinanceService(
        IAppDbContext dbContext,
        IValidator<UpdateCommissionRuleRequest> updateCommissionRuleValidator)
    {
        _dbContext = dbContext;
        _updateCommissionRuleValidator = updateCommissionRuleValidator;
    }

    public async Task<IReadOnlyList<CommissionRuleResponse>> GetCommissionRulesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.CommissionRules
            .OrderBy(x => x.Scope)
            .ThenBy(x => x.Priority)
            .ThenBy(x => x.Name)
            .Select(x => new CommissionRuleResponse
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Description = x.Description,
                Scope = x.Scope.ToString(),
                ValueType = x.ValueType.ToString(),
                Value = x.Value,
                MinAmount = x.MinAmount,
                MaxAmount = x.MaxAmount,
                Priority = x.Priority,
                IsEnabled = x.IsEnabled,
                EffectiveFromUtc = x.EffectiveFromUtc,
                EffectiveToUtc = x.EffectiveToUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CommissionRuleResponse> UpdateCommissionRuleAsync(Guid ruleId, UpdateCommissionRuleRequest request, CancellationToken cancellationToken = default)
    {
        await _updateCommissionRuleValidator.ValidateAndThrowAsync(request, cancellationToken);

        var rule = await _dbContext.CommissionRules
            .FirstOrDefaultAsync(x => x.Id == ruleId, cancellationToken)
            ?? throw new NotFoundException("Commission rule was not found.");

        rule.Name = request.Name.Trim();
        rule.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        rule.Value = request.Value;
        rule.MinAmount = request.MinAmount;
        rule.MaxAmount = request.MaxAmount;
        rule.Priority = request.Priority;
        rule.IsEnabled = request.IsEnabled;
        rule.EffectiveFromUtc = request.EffectiveFromUtc;
        rule.EffectiveToUtc = request.EffectiveToUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CommissionRuleResponse
        {
            Id = rule.Id,
            Code = rule.Code,
            Name = rule.Name,
            Description = rule.Description,
            Scope = rule.Scope.ToString(),
            ValueType = rule.ValueType.ToString(),
            Value = rule.Value,
            MinAmount = rule.MinAmount,
            MaxAmount = rule.MaxAmount,
            Priority = rule.Priority,
            IsEnabled = rule.IsEnabled,
            EffectiveFromUtc = rule.EffectiveFromUtc,
            EffectiveToUtc = rule.EffectiveToUtc
        };
    }

    public async Task<IReadOnlyList<FinancialMovementResponse>> GetFinancialMovementsAsync(FinancialMovementFilterRequest filters, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.FinancialMovements.AsQueryable();

        if (filters.OrderId.HasValue)
        {
            query = query.Where(x => x.OrderId == filters.OrderId.Value);
        }

        if (filters.CommunityRequestId.HasValue)
        {
            query = query.Where(x => x.CommunityRequestId == filters.CommunityRequestId.Value);
        }

        if (filters.RestaurantId.HasValue)
        {
            query = query.Where(x => x.RestaurantId == filters.RestaurantId.Value);
        }

        if (filters.UserId.HasValue)
        {
            query = query.Where(x => x.UserId == filters.UserId.Value);
        }

        if (filters.Type.HasValue)
        {
            query = query.Where(x => x.Type == filters.Type.Value);
        }

        if (filters.Status.HasValue)
        {
            query = query.Where(x => x.Status == filters.Status.Value);
        }

        return await query
            .OrderByDescending(x => x.OccurredAtUtc)
            .Select(x => new FinancialMovementResponse
            {
                Id = x.Id,
                OrderId = x.OrderId,
                CommunityRequestId = x.CommunityRequestId,
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant != null ? x.Restaurant.Name : null,
                UserId = x.UserId,
                UserFullName = x.User != null ? (x.User.FirstName + " " + x.User.LastName).Trim() : null,
                Type = x.Type.ToString(),
                Status = x.Status.ToString(),
                Amount = x.Amount,
                CurrencyCode = x.CurrencyCode,
                OccurredAtUtc = x.OccurredAtUtc,
                AvailableAtUtc = x.AvailableAtUtc,
                SettledAtUtc = x.SettledAtUtc,
                Reference = x.Reference,
                Description = x.Description
            })
            .ToListAsync(cancellationToken);
    }
}
