using FluentValidation;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Application.Services;

public class AdminFinanceService : IAdminFinanceService
{
    private static readonly FinancialMovementType[] PlatformRevenueMovementTypes =
    [
        FinancialMovementType.BusinessCommission,
        FinancialMovementType.DeliveryPlatformCommission,
        FinancialMovementType.ServiceFee,
        FinancialMovementType.FavorPlatformCommission,
        FinancialMovementType.CashOrderDebt,
        FinancialMovementType.CollaboratorVerificationFee
    ];

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

    public async Task<AdminCommissionSummaryResponse> GetCommissionSummaryAsync(CancellationToken cancellationToken = default)
    {
        var platformRevenueTypes = PlatformRevenueMovementTypes;
        var movements = await _dbContext.FinancialMovements
            .Where(x => platformRevenueTypes.Contains(x.Type))
            .GroupBy(x => 1)
            .Select(group => new AdminCommissionSummaryResponse
            {
                PendingAmount = group.Where(x => x.Status == FinancialMovementStatus.Pending).Sum(x => x.Amount),
                AvailableAmount = group.Where(x => x.Status == FinancialMovementStatus.Available).Sum(x => x.Amount),
                SettledAmount = group.Where(x => x.Status == FinancialMovementStatus.Settled).Sum(x => x.Amount),
                CashDebtAmount = group.Where(x => x.Type == FinancialMovementType.CashOrderDebt && x.Status != FinancialMovementStatus.Settled && x.Status != FinancialMovementStatus.Cancelled).Sum(x => x.Amount),
                PendingCount = group.Count(x => x.Status == FinancialMovementStatus.Pending),
                AvailableCount = group.Count(x => x.Status == FinancialMovementStatus.Available),
                CashDebtCount = group.Count(x => x.Type == FinancialMovementType.CashOrderDebt && x.Status != FinancialMovementStatus.Settled && x.Status != FinancialMovementStatus.Cancelled)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return movements ?? new AdminCommissionSummaryResponse();
    }

    public async Task<FinancialMovementResponse> WaiveMovementAsync(Guid movementId, CancellationToken cancellationToken = default)
    {
        var movement = await _dbContext.FinancialMovements
            .FirstOrDefaultAsync(x => x.Id == movementId, cancellationToken)
            ?? throw new NotFoundException("Financial movement was not found.");

        if (movement.Status == FinancialMovementStatus.Settled)
        {
            throw new AppException("No se puede exonerar un movimiento ya liquidado.");
        }

        movement.Status = FinancialMovementStatus.Cancelled;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapMovementQuery(_dbContext.FinancialMovements.Where(x => x.Id == movement.Id))
            .FirstAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SettlementBatchResponse>> GetSettlementsAsync(CancellationToken cancellationToken = default)
    {
        return await MapSettlementQuery(_dbContext.SettlementBatches)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<SettlementBatchResponse> GetSettlementByIdAsync(Guid settlementId, CancellationToken cancellationToken = default)
    {
        return await MapSettlementQuery(_dbContext.SettlementBatches.Where(x => x.Id == settlementId))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Settlement was not found.");
    }

    public async Task<SettlementBatchResponse> CreateSettlementAsync(CreateSettlementBatchRequest request, CancellationToken cancellationToken = default)
    {
        if (request.FinancialMovementIds.Count == 0)
        {
            throw new AppException("Selecciona al menos un movimiento para liquidar.");
        }

        var movementIds = request.FinancialMovementIds.Distinct().ToList();
        var movements = await _dbContext.FinancialMovements
            .Where(x => movementIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        if (movements.Count != movementIds.Count)
        {
            throw new NotFoundException("Uno o más movimientos no fueron encontrados.");
        }

        if (movements.Any(x => x.Status != FinancialMovementStatus.Available))
        {
            throw new AppException("Solo se pueden liquidar movimientos disponibles.");
        }

        var batch = new SettlementBatch
        {
            Id = Guid.NewGuid(),
            TargetType = request.TargetType,
            BusinessId = request.BusinessId,
            DriverId = request.DriverId,
            CollaboratorUserId = request.CollaboratorUserId,
            PeriodStartUtc = request.PeriodStartUtc,
            PeriodEndUtc = request.PeriodEndUtc,
            GrossAmount = movements.Sum(x => x.Amount),
            CommissionAmount = movements.Where(x => x.Type is FinancialMovementType.BusinessCommission or FinancialMovementType.DeliveryPlatformCommission or FinancialMovementType.FavorPlatformCommission or FinancialMovementType.CashOrderDebt or FinancialMovementType.CollaboratorVerificationFee).Sum(x => x.Amount),
            ServiceFeeAmount = movements.Where(x => x.Type == FinancialMovementType.ServiceFee).Sum(x => x.Amount),
            NetAmount = movements.Where(x => x.Type is FinancialMovementType.BusinessNetAmount or FinancialMovementType.CourierEarning).Sum(x => x.Amount),
            Status = SettlementStatus.Pending,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        foreach (var movement in movements)
        {
            batch.Items.Add(new SettlementItem
            {
                Id = Guid.NewGuid(),
                FinancialMovementId = movement.Id,
                GrossAmount = movement.Amount,
                CommissionAmount = IsPlatformRevenueMovement(movement.Type) ? movement.Amount : 0m,
                ServiceFeeAmount = movement.Type == FinancialMovementType.ServiceFee ? movement.Amount : 0m,
                NetAmount = movement.Type is FinancialMovementType.BusinessNetAmount or FinancialMovementType.CourierEarning ? movement.Amount : 0m
            });
        }

        _dbContext.Add(batch);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetSettlementByIdAsync(batch.Id, cancellationToken);
    }

    public async Task<SettlementBatchResponse> MarkSettlementPaidAsync(Guid settlementId, CancellationToken cancellationToken = default)
    {
        var settlement = await _dbContext.SettlementBatches
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == settlementId, cancellationToken)
            ?? throw new NotFoundException("Settlement was not found.");

        if (settlement.Status == SettlementStatus.Paid)
        {
            return await GetSettlementByIdAsync(settlement.Id, cancellationToken);
        }

        if (settlement.Status == SettlementStatus.Cancelled)
        {
            throw new AppException("No se puede pagar una liquidación cancelada.");
        }

        var movementIds = settlement.Items.Select(x => x.FinancialMovementId).ToList();
        var movements = await _dbContext.FinancialMovements
            .Where(x => movementIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        var paidAtUtc = DateTime.UtcNow;
        settlement.Status = SettlementStatus.Paid;
        settlement.ConfirmedAtUtc = paidAtUtc;

        foreach (var movement in movements.Where(x => x.Status != FinancialMovementStatus.Settled))
        {
            movement.Status = FinancialMovementStatus.Settled;
            movement.SettledAtUtc = paidAtUtc;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlement.Id, cancellationToken);
    }

    public async Task<SettlementBatchResponse> CancelSettlementAsync(Guid settlementId, CancellationToken cancellationToken = default)
    {
        var settlement = await _dbContext.SettlementBatches
            .FirstOrDefaultAsync(x => x.Id == settlementId, cancellationToken)
            ?? throw new NotFoundException("Settlement was not found.");

        if (settlement.Status == SettlementStatus.Paid)
        {
            throw new AppException("No se puede cancelar una liquidación pagada.");
        }

        settlement.Status = SettlementStatus.Cancelled;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlement.Id, cancellationToken);
    }

    private static IQueryable<FinancialMovementResponse> MapMovementQuery(IQueryable<FinancialMovement> query)
    {
        return query.Select(x => new FinancialMovementResponse
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
        });
    }

    private static IQueryable<SettlementBatchResponse> MapSettlementQuery(IQueryable<SettlementBatch> query)
    {
        return query.Select(x => new SettlementBatchResponse
        {
            Id = x.Id,
            TargetType = x.TargetType.ToString(),
            BusinessId = x.BusinessId,
            BusinessName = x.Business != null ? x.Business.Name : null,
            DriverId = x.DriverId,
            CollaboratorUserId = x.CollaboratorUserId,
            CollaboratorName = x.CollaboratorUser != null ? (x.CollaboratorUser.FirstName + " " + x.CollaboratorUser.LastName).Trim() : null,
            PeriodStartUtc = x.PeriodStartUtc,
            PeriodEndUtc = x.PeriodEndUtc,
            GrossAmount = x.GrossAmount,
            CommissionAmount = x.CommissionAmount,
            ServiceFeeAmount = x.ServiceFeeAmount,
            NetAmount = x.NetAmount,
            Status = x.Status.ToString(),
            CreatedAtUtc = x.CreatedAtUtc,
            ConfirmedAtUtc = x.ConfirmedAtUtc,
            Notes = x.Notes,
            Items = x.Items.Select(item => new SettlementItemResponse
            {
                Id = item.Id,
                FinancialMovementId = item.FinancialMovementId,
                MovementType = item.FinancialMovement.Type.ToString(),
                GrossAmount = item.GrossAmount,
                CommissionAmount = item.CommissionAmount,
                ServiceFeeAmount = item.ServiceFeeAmount,
                NetAmount = item.NetAmount
            }).ToList()
        });
    }

    private static bool IsPlatformRevenueMovement(FinancialMovementType type)
    {
        return type is FinancialMovementType.BusinessCommission
            or FinancialMovementType.DeliveryPlatformCommission
            or FinancialMovementType.ServiceFee
            or FinancialMovementType.FavorPlatformCommission
            or FinancialMovementType.CashOrderDebt
            or FinancialMovementType.CollaboratorVerificationFee;
    }
}
