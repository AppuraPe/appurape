using FluentValidation;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Security.Cryptography;
using System.Text.Json;

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
        FinancialMovementType.CashFavorDebt,
        FinancialMovementType.CollaboratorVerificationFee
    ];

    private readonly IAppDbContext _dbContext;
    private readonly IValidator<UpdateCommissionRuleRequest> _updateCommissionRuleValidator;
    private readonly ICurrentUserService? _currentUserService;
    private readonly IFileStorageService? _fileStorageService;
    private readonly bool _financeV2Enabled;
    private readonly IRequestAuditContext? _auditContext;

    public AdminFinanceService(
        IAppDbContext dbContext,
        IValidator<UpdateCommissionRuleRequest> updateCommissionRuleValidator,
        ICurrentUserService? currentUserService = null,
        IFileStorageService? fileStorageService = null,
        IConfiguration? configuration = null,
        IRequestAuditContext? auditContext = null)
    {
        _dbContext = dbContext;
        _updateCommissionRuleValidator = updateCommissionRuleValidator;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
        _financeV2Enabled = bool.TryParse(configuration?["FinanceV2:Enabled"], out var enabled) && enabled;
        _auditContext = auditContext;
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

        if (rule.ValueType == CommissionValueType.Percentage && request.Value > 100m)
            throw new AppException("Una comisión porcentual debe estar entre 0 y 100.");

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
                CashDebtAmount = group.Where(x => (x.Type == FinancialMovementType.CashOrderDebt || x.Type == FinancialMovementType.CashFavorDebt) && x.Status != FinancialMovementStatus.Settled && x.Status != FinancialMovementStatus.Cancelled).Sum(x => x.Amount),
                PendingCount = group.Count(x => x.Status == FinancialMovementStatus.Pending),
                AvailableCount = group.Count(x => x.Status == FinancialMovementStatus.Available),
                CashDebtCount = group.Count(x => (x.Type == FinancialMovementType.CashOrderDebt || x.Type == FinancialMovementType.CashFavorDebt) && x.Status != FinancialMovementStatus.Settled && x.Status != FinancialMovementStatus.Cancelled)
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

        if (movement.ReconciliationStatus == FinancialReconciliationStatus.LegacyReconciliationPending)
            throw new AppException("El movimiento histórico debe conciliarse antes de exonerarlo.");

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
        if (request.FinancialMovementIds.Count == 0 && request.FinancialObligationIds.Count == 0)
        {
            throw new AppException("Selecciona al menos un movimiento para liquidar.");
        }

        if (request.FinancialMovementIds.Count != 0 && request.FinancialObligationIds.Count != 0)
            throw new AppException("No mezcles movimientos históricos con obligaciones FinanceV2.");

        if (request.FinancialObligationIds.Count != 0)
            return await CreateObligationSettlementAsync(request, cancellationToken);

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

        if (movements.Any(x => x.ReconciliationStatus == FinancialReconciliationStatus.LegacyReconciliationPending))
            throw new AppException("Estos movimientos históricos deben conciliarse antes de liquidarlos.");

        await ValidateLegacyMovementTargetAsync(request, movements, cancellationToken);

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
            CreatedByAdminId = _currentUserService?.UserId,
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
        await using var transaction = _financeV2Enabled && _dbContext is DbContext efDb && efDb.Database.IsRelational()
            ? await efDb.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken) : null;
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

        if (_financeV2Enabled && _currentUserService is not null && settlement.Status != SettlementStatus.PaymentReported)
            throw new AppException("Primero aprueba la liquidación y registra el comprobante del pago.");
        if (_financeV2Enabled && settlement.PaymentReportedByAdminId.HasValue && _currentUserService?.UserId == settlement.PaymentReportedByAdminId)
            throw new AppException("Quien reportó el pago no puede confirmarlo como pagado.");

        var movementIds = settlement.Items.Where(x => x.IsActive && x.FinancialMovementId.HasValue).Select(x => x.FinancialMovementId!.Value).ToList();
        var movements = await _dbContext.FinancialMovements
            .Where(x => movementIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        var paidAtUtc = DateTime.UtcNow;
        settlement.Status = SettlementStatus.Paid;
        settlement.ConfirmedAtUtc = paidAtUtc;

        if (movements.Any(x => x.Status is FinancialMovementStatus.Cancelled or FinancialMovementStatus.Refunded))
            throw new ConflictException("La liquidación contiene movimientos cancelados o reembolsados.");
        if (movements.Any(x => x.ReconciliationStatus == FinancialReconciliationStatus.LegacyReconciliationPending))
            throw new ConflictException("La liquidación contiene movimientos históricos pendientes de conciliación.");
        foreach (var movement in movements.Where(x => x.Status == FinancialMovementStatus.Available))
        {
            movement.Status = FinancialMovementStatus.Settled;
            movement.SettledAtUtc = paidAtUtc;
        }
        var obligationIds = settlement.Items.Where(x => x.IsActive && x.FinancialObligationId.HasValue).Select(x => x.FinancialObligationId!.Value).ToList();
        var obligations = await _dbContext.FinancialObligations.Where(x => obligationIds.Contains(x.Id)).ToListAsync(cancellationToken);
        if (obligations.Any(x => x.Status != FinancialObligationStatus.InSettlement)) throw new ConflictException("Una obligación cambió antes de confirmar el pago.");
        foreach (var obligation in obligations)
        {
            obligation.Status = FinancialObligationStatus.Settled;
            obligation.SettledAtUtc = paidAtUtc;
            _dbContext.Add(new FinancialMovement
            {
                Id = Guid.NewGuid(), OrderId = obligation.OrderId, CommunityRequestId = obligation.CommunityRequestId,
                Type = MapObligationMovementType(obligation.Concept), Status = FinancialMovementStatus.Settled,
                Amount = obligation.Amount, CurrencyCode = obligation.CurrencyCode, OccurredAtUtc = paidAtUtc,
                AvailableAtUtc = obligation.AvailableAtUtc, SettledAtUtc = paidAtUtc,
                Reference = $"SETTLEMENT-{settlement.Id:N}", Description = $"Obligación {obligation.Reference} liquidada.",
                IsImmutable = true, ReconciliationStatus = FinancialReconciliationStatus.Current
            });
        }
        settlement.ConfirmedByAdminId = _currentUserService?.UserId;
        if (_financeV2Enabled && _currentUserService?.UserId is Guid confirmingAdminId)
            AddSettlementAudit(confirmingAdminId, "settlement-paid", settlement.Id, new { settlement.GrossAmount, settlement.PaymentOperationNumber });

        await _dbContext.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
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

        var activeMovementIds = await _dbContext.SettlementItems.Where(x => x.SettlementBatchId == settlementId && x.IsActive && x.FinancialMovementId.HasValue)
            .Select(x => x.FinancialMovementId!.Value).ToListAsync(cancellationToken);
        if (await _dbContext.FinancialMovements.AnyAsync(x => activeMovementIds.Contains(x.Id) && x.ReconciliationStatus == FinancialReconciliationStatus.LegacyReconciliationPending, cancellationToken))
            throw new AppException("La liquidación histórica debe conciliarse antes de cancelarla.");

        var obligationIds = await _dbContext.SettlementItems.Where(x => x.SettlementBatchId == settlementId && x.IsActive && x.FinancialObligationId.HasValue)
            .Select(x => x.FinancialObligationId!.Value).ToListAsync(cancellationToken);
        var obligations = await _dbContext.FinancialObligations.Where(x => obligationIds.Contains(x.Id)).ToListAsync(cancellationToken);
        foreach (var obligation in obligations.Where(x => x.Status == FinancialObligationStatus.InSettlement)) obligation.Status = FinancialObligationStatus.Available;
        var items = await _dbContext.SettlementItems.Where(x => x.SettlementBatchId == settlementId && x.IsActive).ToListAsync(cancellationToken);
        foreach (var item in items) item.IsActive = false;
        settlement.Status = SettlementStatus.Cancelled;
        if (_financeV2Enabled && _currentUserService?.UserId is Guid cancellingAdminId)
            AddSettlementAudit(cancellingAdminId, "settlement-cancel", settlement.Id, new { settlement.Notes });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlement.Id, cancellationToken);
    }

    public async Task<SettlementBatchResponse> ApproveSettlementAsync(Guid settlementId, CancellationToken cancellationToken = default)
    {
        await using var transaction = _dbContext is DbContext efDb && efDb.Database.IsRelational()
            ? await efDb.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken) : null;
        var adminId = RequireAdmin();
        var settlement = await _dbContext.SettlementBatches.FirstOrDefaultAsync(x => x.Id == settlementId, cancellationToken)
            ?? throw new NotFoundException("Liquidación no encontrada.");
        if (settlement.Status == SettlementStatus.Approved) return await GetSettlementByIdAsync(settlementId, cancellationToken);
        if (settlement.Status != SettlementStatus.Pending) throw new AppException("La liquidación no está pendiente de aprobación.");
        if (settlement.CreatedByAdminId == adminId) throw new AppException("El creador no puede aprobar su propia liquidación.");
        settlement.Status = SettlementStatus.Approved;
        settlement.ApprovedByAdminId = adminId;
        settlement.ApprovedAtUtc = DateTime.UtcNow;
        AddSettlementAudit(adminId, "settlement-approve", settlement.Id, new { settlement.CreatedByAdminId });
        await SaveSettlementWithConflictAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlementId, cancellationToken);
    }

    public async Task<SettlementBatchResponse> ReportSettlementPaymentAsync(Guid settlementId, ReportSettlementPaymentRequest request, CancellationToken cancellationToken = default)
    {
        await using var transaction = _dbContext is DbContext efDb && efDb.Database.IsRelational()
            ? await efDb.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken) : null;
        var adminId = RequireAdmin();
        if (_fileStorageService is null) throw new AppException("El almacenamiento privado no está configurado.");
        var settlement = await _dbContext.SettlementBatches.FirstOrDefaultAsync(x => x.Id == settlementId, cancellationToken)
            ?? throw new NotFoundException("Liquidación no encontrada.");
        if (settlement.Status == SettlementStatus.PaymentReported) return await GetSettlementByIdAsync(settlementId, cancellationToken);
        if (settlement.Status != SettlementStatus.Approved) throw new AppException("La liquidación debe aprobarse antes de transferir dinero.");
        if (request.Amount != settlement.GrossAmount) throw new AppException("El comprobante debe coincidir con el total de la liquidación.");
        if (request.Content.Length == 0 || request.Content.Length > 5 * 1024 * 1024) throw new AppException("El comprobante no es válido.");
        if (string.IsNullOrWhiteSpace(request.OperationNumber) || request.OperationNumber.Trim().Length is < 4 or > 120)
            throw new AppException("Ingresa un número de operación válido.");
        if (request.PaidAtUtc > DateTime.UtcNow.AddMinutes(5) || request.PaidAtUtc < DateTime.UtcNow.AddDays(-30))
            throw new AppException("La fecha declarada del pago no es válida.");
        if (request.ContentType is not ("image/jpeg" or "image/png" or "image/webp"))
            throw new AppException("Usa un comprobante JPG, PNG o WebP.");
        var hash = Convert.ToHexString(SHA256.HashData(request.Content)).ToLowerInvariant();
        if (await _dbContext.SettlementBatches.AnyAsync(x => x.PaymentEvidenceSha256 == hash, cancellationToken)) throw new ConflictException("Este comprobante ya fue utilizado.");
        var path = $"settlements/{settlement.Id:N}/{Guid.NewGuid():N}.jpg";
        await using var stream = new MemoryStream(request.Content, false);
        await _fileStorageService.UploadPrivateImageAsync(stream, request.FileName, request.ContentType, request.Content.LongLength, path, cancellationToken);
        settlement.PaymentOperationNumber = request.OperationNumber.Trim().ToUpperInvariant();
        settlement.PaymentEvidenceObjectPath = path;
        settlement.PaymentEvidenceSha256 = hash;
        settlement.PaymentReportedByAdminId = adminId;
        settlement.PaymentReportedAtUtc = DateTime.UtcNow;
        settlement.Status = SettlementStatus.PaymentReported;
        AddSettlementAudit(adminId, "settlement-payment-report", settlement.Id, new { request.OperationNumber, request.Amount, hash });
        try { await SaveSettlementWithConflictAsync(cancellationToken); }
        catch { await _fileStorageService.DeletePrivateAsync(path, cancellationToken); throw; }
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlementId, cancellationToken);
    }

    public async Task<string> GetSettlementPaymentEvidencePathAsync(Guid settlementId, CancellationToken cancellationToken = default)
    {
        _ = RequireAdmin();
        return await _dbContext.SettlementBatches.AsNoTracking().Where(x => x.Id == settlementId && x.PaymentEvidenceObjectPath != null)
            .Select(x => x.PaymentEvidenceObjectPath!).FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("La liquidación no tiene comprobante de pago.");
    }

    private async Task<SettlementBatchResponse> CreateObligationSettlementAsync(CreateSettlementBatchRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = _dbContext is DbContext efDb && efDb.Database.IsRelational()
            ? await efDb.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken) : null;
        var adminId = RequireAdmin();
        var ids = request.FinancialObligationIds.Distinct().ToList();
        var obligations = await _dbContext.FinancialObligations.Where(x => ids.Contains(x.Id)).ToListAsync(cancellationToken);
        if (obligations.Count != ids.Count) throw new NotFoundException("Una o más obligaciones no fueron encontradas.");
        if (obligations.Any(x => x.Status != FinancialObligationStatus.Available)) throw new AppException("Solo se pueden liquidar obligaciones disponibles.");
        if (obligations.Any(x => x.AvailableAtUtc < request.PeriodStartUtc || x.AvailableAtUtc > request.PeriodEndUtc)) throw new AppException("Todas las obligaciones deben pertenecer al periodo indicado.");
        var first = obligations[0];
        if (obligations.Any(x => x.DebtorType != first.DebtorType || x.DebtorEntityId != first.DebtorEntityId ||
            x.CreditorType != first.CreditorType || x.CreditorEntityId != first.CreditorEntityId || x.CurrencyCode != first.CurrencyCode))
            throw new AppException("Una liquidación solo puede contener el mismo deudor, acreedor y moneda.");
        var target = await ResolveTargetAsync(request, cancellationToken);
        var targetMatches = (first.DebtorType == target.Type && first.DebtorEntityId == target.Id) ||
            (first.CreditorType == target.Type && first.CreditorEntityId == target.Id);
        if (!targetMatches) throw new AppException("Las obligaciones no pertenecen al destinatario declarado.");

        var total = obligations.Sum(x => x.Amount);
        var batch = new SettlementBatch
        {
            Id = Guid.NewGuid(), TargetType = request.TargetType, BusinessId = request.BusinessId, DriverId = request.DriverId,
            CollaboratorUserId = request.CollaboratorUserId, PeriodStartUtc = request.PeriodStartUtc, PeriodEndUtc = request.PeriodEndUtc,
            GrossAmount = total, CommissionAmount = first.CreditorType == FinancialPartyType.Platform ? total : 0m,
            NetAmount = first.CreditorType == FinancialPartyType.Platform ? 0m : total, ServiceFeeAmount = 0m,
            Status = SettlementStatus.Pending, Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            DebtorType = first.DebtorType, DebtorEntityId = first.DebtorEntityId, CreditorType = first.CreditorType,
            CreditorEntityId = first.CreditorEntityId, CreatedByAdminId = adminId
        };
        foreach (var obligation in obligations)
        {
            obligation.Status = FinancialObligationStatus.InSettlement;
            batch.Items.Add(new SettlementItem { Id = Guid.NewGuid(), FinancialObligationId = obligation.Id,
                GrossAmount = obligation.Amount, CommissionAmount = obligation.CreditorType == FinancialPartyType.Platform ? obligation.Amount : 0m,
                NetAmount = obligation.CreditorType == FinancialPartyType.Platform ? 0m : obligation.Amount, ServiceFeeAmount = 0m });
        }
        _dbContext.Add(batch);
        AddSettlementAudit(adminId, "settlement-create", batch.Id, new { ids, total, first.DebtorType, first.DebtorEntityId, first.CreditorType, first.CreditorEntityId });
        try { await _dbContext.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException) { throw new ConflictException("Una obligación ya fue reservada por otra liquidación."); }
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return await GetSettlementByIdAsync(batch.Id, cancellationToken);
    }

    private async Task<(FinancialPartyType Type, Guid Id)> ResolveTargetAsync(CreateSettlementBatchRequest request, CancellationToken cancellationToken)
    {
        return request.TargetType switch
        {
            SettlementTargetType.Business when request.BusinessId.HasValue => (FinancialPartyType.Business, request.BusinessId.Value),
            SettlementTargetType.Collaborator when request.CollaboratorUserId.HasValue => (FinancialPartyType.Collaborator, request.CollaboratorUserId.Value),
            SettlementTargetType.Driver when request.DriverId.HasValue => (FinancialPartyType.Driver,
                await _dbContext.Drivers.Where(x => x.Id == request.DriverId.Value || x.UserId == request.DriverId.Value).Select(x => x.UserId).FirstOrDefaultAsync(cancellationToken) is var id && id != Guid.Empty
                    ? id : throw new NotFoundException("Driver no encontrado.")),
            _ => throw new AppException("Indica exactamente un destinatario válido para la liquidación.")
        };
    }

    private async Task ValidateLegacyMovementTargetAsync(CreateSettlementBatchRequest request, IReadOnlyCollection<FinancialMovement> movements, CancellationToken cancellationToken)
    {
        var target = await ResolveTargetAsync(request, cancellationToken);
        var valid = target.Type switch
        {
            FinancialPartyType.Business => movements.All(x => x.RestaurantId == target.Id),
            FinancialPartyType.Driver or FinancialPartyType.Collaborator => movements.All(x => x.UserId == target.Id),
            _ => false
        };
        if (!valid) throw new AppException("Los movimientos no pertenecen al destinatario declarado.");
    }

    private Guid RequireAdmin() => _currentUserService?.IsAuthenticated == true && _currentUserService.UserId.HasValue && _currentUserService.Role == "Admin"
        ? _currentUserService.UserId.Value : throw new ForbiddenException("Se requiere una cuenta Admin.");

    private void AddSettlementAudit(Guid actorId, string action, Guid settlementId, object data)
    {
        var key = _auditContext?.IdempotencyKey?.Trim();
        _dbContext.Add(new FinancialAuditEvent
        {
            Id = Guid.NewGuid(), ActorUserId = actorId, Action = action, EntityType = "SettlementBatch", EntityId = settlementId,
            IdempotencyKey = string.IsNullOrWhiteSpace(key) ? null : key, DataJson = JsonSerializer.Serialize(data),
            IpAddress = _auditContext?.IpAddress, UserAgent = _auditContext?.UserAgent
        });
    }

    private async Task SaveSettlementWithConflictAsync(CancellationToken cancellationToken)
    {
        try { await _dbContext.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { throw new ConflictException("La liquidación fue modificada por otro administrador."); }
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
            DebtorType = x.DebtorType.HasValue ? x.DebtorType.Value.ToString() : null,
            DebtorEntityId = x.DebtorEntityId,
            CreditorType = x.CreditorType.HasValue ? x.CreditorType.Value.ToString() : null,
            CreditorEntityId = x.CreditorEntityId,
            CreatedByAdminId = x.CreatedByAdminId,
            ApprovedByAdminId = x.ApprovedByAdminId,
            ApprovedAtUtc = x.ApprovedAtUtc,
            PaymentReportedAtUtc = x.PaymentReportedAtUtc,
            PaymentOperationNumber = x.PaymentOperationNumber,
            Items = x.Items.Where(item => item.IsActive).Select(item => new SettlementItemResponse
            {
                Id = item.Id,
                FinancialMovementId = item.FinancialMovementId,
                FinancialObligationId = item.FinancialObligationId,
                MovementType = item.FinancialMovement != null ? item.FinancialMovement.Type.ToString() : item.FinancialObligation!.Concept.ToString(),
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
            or FinancialMovementType.CashFavorDebt
            or FinancialMovementType.CollaboratorVerificationFee;
    }

    private static FinancialMovementType MapObligationMovementType(FinancialObligationConcept concept) => concept switch
    {
        FinancialObligationConcept.BusinessNetCustody => FinancialMovementType.BusinessNetAmount,
        FinancialObligationConcept.CourierEarningCustody => FinancialMovementType.CourierEarning,
        FinancialObligationConcept.FavorPlatformFeeCustody => FinancialMovementType.CashFavorDebt,
        FinancialObligationConcept.RefundCompensation => FinancialMovementType.Refund,
        _ => FinancialMovementType.CashOrderDebt
    };
}
