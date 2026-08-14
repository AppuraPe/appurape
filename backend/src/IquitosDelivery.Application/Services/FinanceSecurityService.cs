using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using IquitosDelivery.Application.DTOs.Finance;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace IquitosDelivery.Application.Services;

public sealed class FinanceSecurityService : IFinanceSecurityService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _storage;
    private readonly bool _financeV2Enabled;
    private readonly IRequestAuditContext? _auditContext;

    public FinanceSecurityService(IAppDbContext db, ICurrentUserService currentUser, IFileStorageService storage, IConfiguration? configuration = null, IRequestAuditContext? auditContext = null)
    {
        _db = db;
        _currentUser = currentUser;
        _storage = storage;
        _financeV2Enabled = bool.TryParse(configuration?["FinanceV2:Enabled"], out var financeV2Enabled) && financeV2Enabled;
        _auditContext = auditContext;
    }

    public async Task<PaymentEvidenceResponse> SubmitPaymentEvidenceAsync(Guid orderId, PaymentEvidenceUploadRequest request, string? idempotencyKey, CancellationToken cancellationToken = default)
    {
        idempotencyKey = RequireIdempotencyKey(idempotencyKey);
        var userId = RequireUser();
        var payment = await _db.Payments.Include(x => x.Order).ThenInclude(x => x.Customer)
            .FirstOrDefaultAsync(x => x.OrderId == orderId && x.Order.Customer.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("No encontramos el pago del pedido.");
        if (payment.Method is not (PaymentMethod.Yape or PaymentMethod.Plin)) throw new AppException("Solo Yape o Plin admiten comprobante manual.");
        if (payment.Status is PaymentStatus.Paid or PaymentStatus.Refunded or PaymentStatus.RefundPending) throw new AppException("El pago ya no admite comprobantes.");

        var existing = await _db.PaymentEvidence.AsNoTracking().FirstOrDefaultAsync(x => x.PaymentId == payment.Id && x.IsActive, cancellationToken);
        if (await IsReplayAsync("payment-evidence", idempotencyKey, cancellationToken) && existing is not null) return Map(existing);

        ValidateImage(request.Content, request.ContentType);
        var operation = NormalizeOperation(request.OperationNumber);
        if (request.DeclaredAmount != payment.Amount) throw new AppException("El monto declarado debe coincidir exactamente con el total del pedido.");
        if (request.PaidAtUtc > DateTime.UtcNow.AddMinutes(5) || request.PaidAtUtc < DateTime.UtcNow.AddDays(-7)) throw new AppException("La fecha declarada del pago no es válida.");
        var hash = Convert.ToHexString(SHA256.HashData(request.Content)).ToLowerInvariant();
        if (await _db.PaymentEvidence.AnyAsync(x => x.IsActive && x.PaymentId != payment.Id && (x.OperationNumber == operation && x.Method == payment.Method || x.ContentSha256 == hash), cancellationToken))
            throw new ConflictException("Este número de operación o comprobante ya fue utilizado.");

        var path = $"payments/{payment.Id:N}/{Guid.NewGuid():N}{Extension(request.ContentType)}";
        await using var stream = new MemoryStream(request.Content, writable: false);
        await _storage.UploadPrivateImageAsync(stream, request.FileName, request.ContentType, request.Content.LongLength, path, cancellationToken);
        try
        {
            if (existing is not null) existing.IsActive = false;
            var evidence = new PaymentEvidence
            {
                Id = Guid.NewGuid(), PaymentId = payment.Id, Method = payment.Method, OperationNumber = operation,
                DeclaredAmount = request.DeclaredAmount, PaidAtUtc = request.PaidAtUtc.ToUniversalTime(), PrivateObjectPath = path,
                ContentSha256 = hash, SubmittedByUserId = userId, IsActive = true
            };
            payment.Status = PaymentStatus.PendingConfirmation;
            payment.ManualReference = operation;
            _db.Add(evidence);
            AddAudit(userId, "payment-evidence", "Payment", payment.Id, idempotencyKey, new { evidence.Id, operation, hash });
            await _db.SaveChangesAsync(cancellationToken);
            return Map(evidence);
        }
        catch (DbUpdateException)
        {
            await _storage.DeletePrivateAsync(path, cancellationToken);
            throw new ConflictException("El comprobante fue registrado simultáneamente o ya está en uso.");
        }
    }

    public async Task<PaymentEvidenceResponse> GetBusinessPaymentEvidenceAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var userId = RequireUser();
        var evidence = await _db.PaymentEvidence.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Payment.OrderId == orderId && x.Payment.Order.Restaurant.OwnerUserId == userId && x.IsActive, cancellationToken)
            ?? throw new NotFoundException("El pedido todavía no tiene comprobante activo.");
        return Map(evidence);
    }

    public async Task<string> GetPaymentEvidenceObjectPathAsync(Guid evidenceId, CancellationToken cancellationToken = default)
    {
        var userId = RequireUser();
        var role = _currentUser.Role;
        var evidence = await _db.PaymentEvidence.AsNoTracking().FirstOrDefaultAsync(x => x.Id == evidenceId && x.IsActive, cancellationToken)
            ?? throw new NotFoundException("Comprobante no encontrado.");
        var allowed = role == "Admin" || await _db.Payments.AnyAsync(x => x.Id == evidence.PaymentId &&
            (x.Order.Customer.UserId == userId || x.Order.Restaurant.OwnerUserId == userId), cancellationToken);
        if (!allowed) throw new ForbiddenException("No tienes acceso a este comprobante.");
        return evidence.PrivateObjectPath;
    }

    public async Task OpenPaymentReviewAsync(Guid paymentId, OpenPaymentReviewRequest request, string? idempotencyKey, CancellationToken cancellationToken = default)
    {
        idempotencyKey = RequireIdempotencyKey(idempotencyKey);
        var userId = RequireUser();
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new AppException("Indica el motivo de la revisión.");
        var payment = await _db.Payments.FirstOrDefaultAsync(x => x.Id == paymentId &&
            (x.Order.Customer.UserId == userId || x.Order.Restaurant.OwnerUserId == userId), cancellationToken)
            ?? throw new NotFoundException("Pago no encontrado.");
        if (await IsReplayAsync("payment-review", idempotencyKey, cancellationToken)) return;
        if (payment.Status is not (PaymentStatus.PendingConfirmation or PaymentStatus.Rejected)) throw new AppException("El pago no puede abrirse a revisión.");
        payment.Status = PaymentStatus.UnderReview;
        payment.FailureReason = request.Reason.Trim();
        AddAudit(userId, "payment-review", "Payment", payment.Id, idempotencyKey, new { request.Reason });
        await SaveWithConflictAsync(cancellationToken);
    }

    public async Task ReleaseDuplicateEvidenceAsync(Guid evidenceId, ReleaseDuplicateEvidenceRequest request, string? idempotencyKey, CancellationToken cancellationToken = default)
    {
        idempotencyKey = RequireIdempotencyKey(idempotencyKey);
        var adminId = RequireUser();
        if (_currentUser.Role != "Admin") throw new ForbiddenException("Solo Admin puede liberar un falso positivo.");
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 10)
            throw new AppException("Indica un motivo auditado de al menos 10 caracteres.");
        var evidence = await _db.PaymentEvidence.Include(x => x.Payment).FirstOrDefaultAsync(x => x.Id == evidenceId, cancellationToken)
            ?? throw new NotFoundException("Comprobante no encontrado.");
        if (!evidence.IsActive) return;
        if (evidence.Payment.Status is PaymentStatus.Paid or PaymentStatus.Refunded)
            throw new AppException("No se puede liberar un comprobante asociado a un pago cerrado.");
        evidence.IsActive = false;
        evidence.DuplicateOverrideReason = request.Reason.Trim();
        evidence.DuplicateOverrideByAdminId = adminId;
        evidence.Payment.Status = PaymentStatus.UnderReview;
        AddAudit(adminId, "payment-evidence-release", "PaymentEvidence", evidence.Id, idempotencyKey, new { request.Reason, evidence.PaymentId });
        await SaveWithConflictAsync(cancellationToken);
    }

    public async Task<RefundResponse> CreateRefundAsync(Guid orderId, string reason, string? idempotencyKey, CancellationToken cancellationToken = default)
    {
        idempotencyKey = RequireIdempotencyKey(idempotencyKey);
        var userId = RequireUser();
        var existing = await _db.RefundRequests.Include(x => x.Evidence).FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);
        if (existing is not null) return Map(existing);
        var payment = await _db.Payments.Include(x => x.Order).ThenInclude(x => x.Customer)
            .FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken) ?? throw new NotFoundException("Pago no encontrado.");
        var isAdmin = _currentUser.Role == "Admin";
        var isCustomer = payment.Order.Customer.UserId == userId;
        var isBusiness = await _db.Restaurants.AnyAsync(x => x.Id == payment.Order.RestaurantId && x.OwnerUserId == userId, cancellationToken);
        if (!isAdmin && !isCustomer && !isBusiness) throw new ForbiddenException("No puedes solicitar este reembolso.");
        if (payment.Status != PaymentStatus.Paid) throw new AppException("Solo un pago confirmado puede entrar a reembolso.");
        if (string.IsNullOrWhiteSpace(reason)) throw new AppException("Indica el motivo del reembolso.");
        var refund = new RefundRequest
        {
            Id = Guid.NewGuid(), OrderId = orderId, PaymentId = payment.Id, Status = RefundStatus.AwaitingBusinessRefund,
            Amount = payment.Amount, CurrencyCode = payment.Currency, Reason = reason.Trim(), RequestedByUserId = userId, RequestedAtUtc = DateTime.UtcNow
        };
        payment.Status = PaymentStatus.RefundPending;
        _db.Add(refund);
        AddAudit(userId, "refund-create", "RefundRequest", refund.Id, idempotencyKey, new { orderId, refund.Amount, refund.Reason });
        await SaveWithConflictAsync(cancellationToken);
        return Map(refund);
    }

    public async Task<RefundResponse> GetRefundForOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var userId = RequireUser();
        var refund = await _db.RefundRequests.AsNoTracking().Include(x => x.Evidence)
            .FirstOrDefaultAsync(x => x.OrderId == orderId &&
                (_currentUser.Role == "Admin" || x.Order.Customer.UserId == userId || x.Order.Restaurant.OwnerUserId == userId), cancellationToken)
            ?? throw new NotFoundException("Reembolso no encontrado.");
        return Map(refund);
    }

    public async Task<RefundResponse> SubmitBusinessRefundEvidenceAsync(Guid refundId, RefundEvidenceUploadRequest request, string? idempotencyKey, CancellationToken cancellationToken = default)
    {
        idempotencyKey = RequireIdempotencyKey(idempotencyKey);
        var userId = RequireUser();
        var refund = await _db.RefundRequests.Include(x => x.Order).Include(x => x.Evidence)
            .FirstOrDefaultAsync(x => x.Id == refundId && x.Order.Restaurant.OwnerUserId == userId, cancellationToken)
            ?? throw new NotFoundException("Reembolso no encontrado.");
        if (refund.Status == RefundStatus.AwaitingCustomerConfirmation && refund.Evidence.Count != 0) return Map(refund);
        if (refund.Status != RefundStatus.AwaitingBusinessRefund) throw new AppException("El reembolso no admite comprobante en su estado actual.");
        ValidateImage(request.Content, request.ContentType);
        if (request.Amount != refund.Amount) throw new AppException("El monto devuelto debe coincidir con el pago.");
        if (request.RefundedAtUtc > DateTime.UtcNow.AddMinutes(5) || request.RefundedAtUtc < DateTime.UtcNow.AddDays(-30))
            throw new AppException("La fecha declarada de la devolución no es válida.");
        var operation = NormalizeOperation(request.OperationNumber);
        var hash = Convert.ToHexString(SHA256.HashData(request.Content)).ToLowerInvariant();
        if (await _db.RefundEvidence.AnyAsync(x => x.ContentSha256 == hash || x.OperationNumber == operation, cancellationToken)) throw new ConflictException("El comprobante de devolución ya fue utilizado.");
        var path = $"refunds/{refund.Id:N}/{Guid.NewGuid():N}{Extension(request.ContentType)}";
        await using var stream = new MemoryStream(request.Content, false);
        await _storage.UploadPrivateImageAsync(stream, request.FileName, request.ContentType, request.Content.LongLength, path, cancellationToken);
        var evidence = new RefundEvidence { Id = Guid.NewGuid(), RefundRequestId = refund.Id, OperationNumber = operation, Amount = request.Amount,
            RefundedAtUtc = request.RefundedAtUtc.ToUniversalTime(), PrivateObjectPath = path, ContentSha256 = hash, SubmittedByUserId = userId };
        refund.Status = RefundStatus.AwaitingCustomerConfirmation;
        refund.BusinessReportedAtUtc = DateTime.UtcNow;
        _db.Add(evidence);
        AddAudit(userId, "refund-evidence", "RefundRequest", refund.Id, idempotencyKey, new { evidence.Id, operation, hash });
        try { await SaveWithConflictAsync(cancellationToken); }
        catch { await _storage.DeletePrivateAsync(path, cancellationToken); throw; }
        return Map(refund);
    }

    public Task<RefundResponse> ConfirmCustomerRefundAsync(Guid refundId, string? idempotencyKey, CancellationToken cancellationToken = default) =>
        CompleteRefundAsync(refundId, true, null, idempotencyKey, false, cancellationToken);

    public Task<RefundResponse> DisputeCustomerRefundAsync(Guid refundId, string reason, string? idempotencyKey, CancellationToken cancellationToken = default) =>
        CompleteRefundAsync(refundId, false, reason, idempotencyKey, false, cancellationToken);

    public Task<RefundResponse> ResolveRefundAsync(Guid refundId, ResolveRefundRequest request, string? idempotencyKey, CancellationToken cancellationToken = default) =>
        CompleteRefundAsync(refundId, request.Complete, request.Reason, idempotencyKey, true, cancellationToken);

    public async Task<IReadOnlyList<RefundResponse>> GetAdminRefundsAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUser.Role != "Admin") throw new ForbiddenException("Solo Admin puede revisar reembolsos.");
        var refunds = await _db.RefundRequests.AsNoTracking().Include(x => x.Evidence)
            .Where(x => x.Status == RefundStatus.Disputed || x.Status == RefundStatus.Failed)
            .OrderBy(x => x.RequestedAtUtc).ToListAsync(cancellationToken);
        return refunds.Select(Map).ToList();
    }

    public async Task<string> GetRefundEvidenceObjectPathAsync(Guid evidenceId, CancellationToken cancellationToken = default)
    {
        var userId = RequireUser();
        var evidence = await _db.RefundEvidence.AsNoTracking().FirstOrDefaultAsync(x => x.Id == evidenceId, cancellationToken)
            ?? throw new NotFoundException("Comprobante no encontrado.");
        var allowed = _currentUser.Role == "Admin" || await _db.RefundRequests.AnyAsync(x => x.Id == evidence.RefundRequestId &&
            (x.Order.Customer.UserId == userId || x.Order.Restaurant.OwnerUserId == userId), cancellationToken);
        if (!allowed) throw new ForbiddenException("No tienes acceso al comprobante.");
        return evidence.PrivateObjectPath;
    }

    public async Task<IReadOnlyList<FinancialObligationResponse>> GetObligationsAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUser.Role != "Admin") throw new ForbiddenException("Solo Admin puede consultar todas las obligaciones.");
        return await _db.FinancialObligations.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Select(x => new FinancialObligationResponse(
            x.Id, x.OrderId, x.CommunityRequestId, x.DebtorType.ToString(), x.DebtorEntityId, x.CreditorType.ToString(), x.CreditorEntityId,
            x.Concept.ToString(), x.Status.ToString(), x.Amount, x.CurrencyCode, x.Reference, x.AvailableAtUtc, x.DueAtUtc)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LegacyMovementResponse>> GetLegacyMovementsAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUser.Role != "Admin") throw new ForbiddenException("Solo Admin puede conciliar históricos.");
        return await _db.FinancialMovements.AsNoTracking()
            .Where(x => x.ReconciliationStatus == FinancialReconciliationStatus.LegacyReconciliationPending)
            .OrderBy(x => x.OccurredAtUtc)
            .Select(x => new LegacyMovementResponse(x.Id, x.OrderId, x.CommunityRequestId, x.Type.ToString(), x.Status.ToString(),
                x.Amount, x.CurrencyCode, x.Reference, x.ReconciliationStatus.ToString())).ToListAsync(cancellationToken);
    }

    public async Task<LegacyMovementResponse> ReconcileLegacyMovementAsync(Guid movementId, ReconciliationDecisionRequest request, CancellationToken cancellationToken = default)
    {
        var adminId = RequireUser();
        if (_currentUser.Role != "Admin") throw new ForbiddenException("Solo Admin puede conciliar históricos.");
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 5) throw new AppException("Indica un motivo de al menos 5 caracteres.");
        var movement = await _db.FinancialMovements.FirstOrDefaultAsync(x => x.Id == movementId, cancellationToken)
            ?? throw new NotFoundException("Movimiento no encontrado.");
        if (movement.ReconciliationStatus != FinancialReconciliationStatus.LegacyReconciliationPending)
            throw new AppException("El movimiento ya fue conciliado.");
        switch (request.Decision.Trim().ToLowerInvariant())
        {
            case "recognized":
            case "reconocido":
                movement.ReconciliationStatus = FinancialReconciliationStatus.Recognized;
                break;
            case "cancelled":
            case "cancelado":
                movement.ReconciliationStatus = FinancialReconciliationStatus.Cancelled;
                movement.Status = FinancialMovementStatus.Cancelled;
                break;
            case "converted":
            case "convertido":
                if (!request.DebtorType.HasValue || !request.CreditorType.HasValue || !request.Concept.HasValue)
                    throw new AppException("Indica deudor, acreedor y concepto para convertir el movimiento.");
                _db.Add(new FinancialObligation
                {
                    Id = Guid.NewGuid(), OrderId = movement.OrderId, CommunityRequestId = movement.CommunityRequestId,
                    DebtorType = request.DebtorType.Value, DebtorEntityId = request.DebtorEntityId,
                    CreditorType = request.CreditorType.Value, CreditorEntityId = request.CreditorEntityId,
                    Concept = request.Concept.Value,
                    Status = movement.Status == FinancialMovementStatus.Available ? FinancialObligationStatus.Available : FinancialObligationStatus.Pending,
                    Amount = movement.Amount, CurrencyCode = movement.CurrencyCode, AvailableAtUtc = movement.AvailableAtUtc,
                    SnapshotJson = JsonSerializer.Serialize(new { legacyMovementId = movement.Id, reason = request.Reason.Trim() }),
                    Reference = movement.Reference ?? $"LEGACY-{movement.Id:N}"
                });
                movement.ReconciliationStatus = FinancialReconciliationStatus.ConvertedToObligation;
                break;
            default:
                throw new AppException("Decisión de conciliación no válida.");
        }
        AddAudit(adminId, "legacy-reconciliation", "FinancialMovement", movement.Id, null, request);
        await _db.SaveChangesAsync(cancellationToken);
        return new LegacyMovementResponse(movement.Id, movement.OrderId, movement.CommunityRequestId, movement.Type.ToString(), movement.Status.ToString(),
            movement.Amount, movement.CurrencyCode, movement.Reference, movement.ReconciliationStatus.ToString());
    }

    public Task CreateOrderObligationsAsync(Order order, Guid businessOwnerUserId, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return Task.CompletedTask;
        var collector = order.PaymentMethod == PaymentMethod.Cash && order.DeliveryMode == DeliveryMode.VerifiedDriverDelivery
            ? FinancialPartyType.Driver : FinancialPartyType.Business;
        Guid? collectorId = collector == FinancialPartyType.Business ? order.RestaurantId : null;
        AddObligation(order, collector, collectorId, FinancialPartyType.Platform, null, FinancialObligationConcept.PlatformRevenueCustody, order.PlatformRevenueAmount);
        if (collector == FinancialPartyType.Driver)
            AddObligation(order, collector, null, FinancialPartyType.Business, order.RestaurantId, FinancialObligationConcept.BusinessNetCustody, order.BusinessNetAmount);
        if (collector == FinancialPartyType.Business && order.DeliveryMode == DeliveryMode.VerifiedDriverDelivery)
            AddObligation(order, collector, order.RestaurantId, FinancialPartyType.Driver, null, FinancialObligationConcept.CourierEarningCustody, order.CourierEarningAmount);
        return Task.CompletedTask;
    }

    public async Task ReplacePendingOrderObligationsAsync(Order order, Guid businessOwnerUserId, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return;
        var existing = await _db.FinancialObligations.Where(x => x.OrderId == order.Id && x.Status == FinancialObligationStatus.Pending).ToListAsync(cancellationToken);
        foreach (var item in existing) _db.Remove(item);
        await CreateOrderObligationsAsync(order, businessOwnerUserId, cancellationToken);
    }

    public async Task AssignOrderCourierAsync(Guid orderId, Guid courierUserId, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return;
        var obligations = await _db.FinancialObligations.Where(x => x.OrderId == orderId &&
            (x.DebtorType == FinancialPartyType.Driver && x.DebtorEntityId == null || x.CreditorType == FinancialPartyType.Driver && x.CreditorEntityId == null)).ToListAsync(cancellationToken);
        foreach (var item in obligations)
        {
            if (item.DebtorType == FinancialPartyType.Driver) item.DebtorEntityId = courierUserId;
            if (item.CreditorType == FinancialPartyType.Driver) item.CreditorEntityId = courierUserId;
        }
    }

    public async Task MarkOrderObligationsAvailableAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return;
        await SetObligationStatusAsync(x => x.OrderId == orderId, FinancialObligationStatus.Available, cancellationToken);
        var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);
        if (order is null) return;
        var reference = $"DIRECT-ORDER-{order.Id:N}";
        if (await _db.FinancialMovements.AnyAsync(x => x.Reference == reference, cancellationToken)) return;
        if (order.PaymentMethod is PaymentMethod.Yape or PaymentMethod.Plin || order.DeliveryMode is DeliveryMode.PickupOrDirect or DeliveryMode.BusinessDelivery)
            AddSettledMovement(order.Id, null, order.RestaurantId, FinancialMovementType.BusinessNetAmount, order.BusinessNetAmount, reference,
                "Neto conservado directamente por el negocio.");
        if (order.DeliveryMode == DeliveryMode.BusinessDelivery)
            AddSettledMovement(order.Id, null, order.RestaurantId, FinancialMovementType.CourierEarning, order.CourierEarningAmount, reference,
                "Importe de delivery propio conservado directamente por el negocio.");
        if (order.PaymentMethod == PaymentMethod.Cash && order.DeliveryMode == DeliveryMode.VerifiedDriverDelivery)
            AddSettledMovement(order.Id, null, null, FinancialMovementType.CourierEarning, order.CourierEarningAmount, reference,
                "Ganancia de reparto cobrada directamente en efectivo.", order.AssignedCourierUserId);
    }

    public async Task CancelOrderObligationsAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        await SetObligationStatusIfEnabledAsync(x => x.OrderId == orderId, FinancialObligationStatus.Cancelled, cancellationToken);

    public Task CreateFavorObligationAsync(CommunityRequest request, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return Task.CompletedTask;
        if (request.FavorPlatformCommissionAmount <= 0) return Task.CompletedTask;
        _db.Add(new FinancialObligation
        {
            Id = Guid.NewGuid(), CommunityRequestId = request.Id, DebtorType = FinancialPartyType.Collaborator,
            CreditorType = FinancialPartyType.Platform, Concept = FinancialObligationConcept.FavorPlatformFeeCustody,
            Status = FinancialObligationStatus.Pending, Amount = request.FavorPlatformCommissionAmount,
            DueAtUtc = (request.DeadlineUtc ?? DateTime.UtcNow.AddDays(1)).AddDays(7), SnapshotJson = request.PricingSnapshotJson ?? "{}",
            Reference = $"FAVOR-{request.Id:N}"
        });
        return Task.CompletedTask;
    }

    public async Task AssignFavorCollaboratorAsync(Guid requestId, Guid collaboratorUserId, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return;
        var items = await _db.FinancialObligations.Where(x => x.CommunityRequestId == requestId && x.DebtorType == FinancialPartyType.Collaborator).ToListAsync(cancellationToken);
        foreach (var item in items) item.DebtorEntityId = collaboratorUserId;
    }

    public async Task MarkFavorObligationsAvailableAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        if (!_financeV2Enabled) return;
        await SetObligationStatusAsync(x => x.CommunityRequestId == requestId, FinancialObligationStatus.Available, cancellationToken);
        var favor = await _db.CommunityRequests.AsNoTracking().Where(x => x.Id == requestId)
            .Select(x => new { x.Id, x.CollaboratorEarningAmount, CollaboratorUserId = x.AssignedCollaborator != null ? (Guid?)x.AssignedCollaborator.UserId : null })
            .FirstOrDefaultAsync(cancellationToken);
        if (favor is null) return;
        var reference = $"DIRECT-FAVOR-{favor.Id:N}";
        if (!await _db.FinancialMovements.AnyAsync(x => x.Reference == reference, cancellationToken))
            AddSettledMovement(null, favor.Id, null, FinancialMovementType.CourierEarning, favor.CollaboratorEarningAmount, reference,
                "Ganancia del colaborador cobrada directamente en efectivo; AppuraPe no debe volver a pagarla.", favor.CollaboratorUserId);
    }

    private async Task<RefundResponse> CompleteRefundAsync(Guid refundId, bool complete, string? reason, string? idempotencyKey, bool admin, CancellationToken cancellationToken)
    {
        idempotencyKey = RequireIdempotencyKey(idempotencyKey);
        var userId = RequireUser();
        var refund = await _db.RefundRequests.Include(x => x.Evidence).Include(x => x.Payment).Include(x => x.Order).ThenInclude(x => x.Customer)
            .FirstOrDefaultAsync(x => x.Id == refundId, cancellationToken) ?? throw new NotFoundException("Reembolso no encontrado.");
        if (admin)
        {
            if (_currentUser.Role != "Admin") throw new ForbiddenException("Solo Admin puede resolver disputas.");
            if (refund.Status != RefundStatus.Disputed) throw new AppException("Solo se pueden resolver reembolsos en disputa.");
            if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10)
                throw new AppException("La resolución administrativa requiere un motivo de al menos 10 caracteres.");
        }
        else if (refund.Order.Customer.UserId != userId) throw new ForbiddenException("Solo el cliente puede confirmar o disputar la devolución.");
        if (refund.Status == RefundStatus.Completed) return Map(refund);
        if (!admin && refund.Status != RefundStatus.AwaitingCustomerConfirmation) throw new AppException("La devolución aún no espera confirmación del cliente.");
        if (!complete)
        {
            if (string.IsNullOrWhiteSpace(reason)) throw new AppException("Indica el motivo de la disputa o rechazo.");
            refund.Status = admin ? RefundStatus.Rejected : RefundStatus.Disputed;
            refund.DisputedAtUtc ??= DateTime.UtcNow;
            refund.ResolutionReason = reason.Trim();
        }
        else
        {
            refund.Status = RefundStatus.Completed;
            refund.CompletedAtUtc = DateTime.UtcNow;
            refund.CustomerConfirmedAtUtc = admin ? refund.CustomerConfirmedAtUtc : DateTime.UtcNow;
            refund.ResolvedByAdminId = admin ? userId : null;
            refund.ResolutionReason = admin ? reason?.Trim() : null;
            refund.Payment.Status = PaymentStatus.Refunded;
            var obligations = await _db.FinancialObligations.Where(x => x.OrderId == refund.OrderId).ToListAsync(cancellationToken);
            foreach (var obligation in obligations)
            {
                if (obligation.Status is FinancialObligationStatus.Pending or FinancialObligationStatus.Available) obligation.Status = FinancialObligationStatus.Cancelled;
                else if (obligation.Status == FinancialObligationStatus.Settled)
                    _db.Add(new FinancialObligation { Id = Guid.NewGuid(), RefundRequestId = refund.Id, DebtorType = obligation.CreditorType,
                        DebtorEntityId = obligation.CreditorEntityId, CreditorType = obligation.DebtorType, CreditorEntityId = obligation.DebtorEntityId,
                        Concept = FinancialObligationConcept.RefundCompensation, Status = FinancialObligationStatus.Available, Amount = obligation.Amount,
                        SnapshotJson = JsonSerializer.Serialize(new { sourceObligationId = obligation.Id }), Reference = $"REFUND-{refund.Id:N}", ReversalOfId = obligation.Id });
            }
            _db.Add(new FinancialMovement { Id = Guid.NewGuid(), OrderId = refund.OrderId, Type = FinancialMovementType.Refund,
                Status = FinancialMovementStatus.Refunded, Amount = refund.Amount, OccurredAtUtc = DateTime.UtcNow,
                Reference = $"REFUND-{refund.Id:N}", Description = "Reembolso confirmado con evidencia." , IsImmutable = true});
        }
        AddAudit(userId, complete ? "refund-complete" : "refund-dispute", "RefundRequest", refund.Id, idempotencyKey, new { complete, reason, admin });
        await SaveWithConflictAsync(cancellationToken);
        return Map(refund);
    }

    private void AddObligation(Order order, FinancialPartyType debtorType, Guid? debtorId, FinancialPartyType creditorType, Guid? creditorId, FinancialObligationConcept concept, decimal amount)
    {
        if (amount <= 0) return;
        _db.Add(new FinancialObligation { Id = Guid.NewGuid(), OrderId = order.Id, DebtorType = debtorType, DebtorEntityId = debtorId,
            CreditorType = creditorType, CreditorEntityId = creditorId, Concept = concept, Status = FinancialObligationStatus.Pending,
            Amount = amount, DueAtUtc = DateTime.UtcNow.AddDays(7), SnapshotJson = order.PricingSnapshotJson ?? "{}", Reference = $"ORDER-{order.Id:N}" });
    }

    private void AddSettledMovement(Guid? orderId, Guid? communityRequestId, Guid? restaurantId, FinancialMovementType type,
        decimal amount, string reference, string description, Guid? userId = null)
    {
        if (amount <= 0m) return;
        _db.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(), OrderId = orderId, CommunityRequestId = communityRequestId, RestaurantId = restaurantId,
            UserId = userId, Type = type, Status = FinancialMovementStatus.Settled, Amount = amount,
            OccurredAtUtc = DateTime.UtcNow, AvailableAtUtc = DateTime.UtcNow, SettledAtUtc = DateTime.UtcNow,
            Reference = reference, Description = description, IsImmutable = true,
            ReconciliationStatus = FinancialReconciliationStatus.Current
        });
    }

    private async Task SetObligationStatusAsync(System.Linq.Expressions.Expression<Func<FinancialObligation, bool>> predicate, FinancialObligationStatus status, CancellationToken cancellationToken)
    {
        var items = await _db.FinancialObligations.Where(predicate).Where(x => x.Status == FinancialObligationStatus.Pending).ToListAsync(cancellationToken);
        foreach (var item in items) { item.Status = status; if (status == FinancialObligationStatus.Available) item.AvailableAtUtc = DateTime.UtcNow; }
    }

    private Task SetObligationStatusIfEnabledAsync(System.Linq.Expressions.Expression<Func<FinancialObligation, bool>> predicate, FinancialObligationStatus status, CancellationToken cancellationToken) =>
        _financeV2Enabled ? SetObligationStatusAsync(predicate, status, cancellationToken) : Task.CompletedTask;

    private Guid RequireUser() => _currentUser.IsAuthenticated && _currentUser.UserId.HasValue
        ? _currentUser.UserId.Value : throw new UnauthorizedException("Debes iniciar sesión.");

    private async Task<bool> IsReplayAsync(string action, string? key, CancellationToken cancellationToken) =>
        !string.IsNullOrWhiteSpace(key) && await _db.FinancialAuditEvents.AnyAsync(x => x.ActorUserId == _currentUser.UserId && x.Action == action && x.IdempotencyKey == key, cancellationToken);

    private void AddAudit(Guid actor, string action, string entityType, Guid entityId, string? key, object data) =>
        _db.Add(new FinancialAuditEvent { Id = Guid.NewGuid(), ActorUserId = actor, Action = action, EntityType = entityType,
            EntityId = entityId, IdempotencyKey = string.IsNullOrWhiteSpace(key) ? null : key.Trim(), DataJson = JsonSerializer.Serialize(data),
            IpAddress = _auditContext?.IpAddress, UserAgent = _auditContext?.UserAgent });

    private async Task SaveWithConflictAsync(CancellationToken cancellationToken)
    {
        try { await _db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { throw new ConflictException("La operación cambió mientras la procesabas. Actualiza e inténtalo nuevamente."); }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
        { throw new ConflictException("La operación ya fue procesada."); }
    }

    private static string NormalizeOperation(string value)
    {
        var normalized = Regex.Replace(value?.Trim().ToUpperInvariant() ?? string.Empty, "[^A-Z0-9]", string.Empty);
        if (normalized.Length is < 4 or > 80) throw new AppException("Ingresa un número de operación válido.");
        return normalized;
    }

    private static string RequireIdempotencyKey(string? value)
    {
        var key = value?.Trim();
        if (string.IsNullOrWhiteSpace(key) || key.Length > 100) throw new AppException("Envía un Idempotency-Key válido para esta operación.");
        return key;
    }

    private static void ValidateImage(byte[] content, string contentType)
    {
        if (content.Length == 0 || content.Length > 5 * 1024 * 1024) throw new AppException("El comprobante debe pesar entre 1 byte y 5 MB.");
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp")) throw new AppException("Usa una imagen JPG, PNG o WebP.");
    }

    private static string Extension(string contentType) => contentType switch { "image/png" => ".png", "image/webp" => ".webp", _ => ".jpg" };
    private static PaymentEvidenceResponse Map(PaymentEvidence x) => new(x.Id, x.PaymentId, x.Method.ToString(), x.OperationNumber, x.DeclaredAmount, x.PaidAtUtc, x.CreatedAtUtc);
    private static RefundResponse Map(RefundRequest x) => new(x.Id, x.OrderId, x.Status.ToString(), x.Amount, x.CurrencyCode, x.Reason,
        x.RequestedAtUtc, x.BusinessReportedAtUtc, x.CustomerConfirmedAtUtc, x.CompletedAtUtc, x.ResolutionReason,
        x.Evidence.OrderByDescending(e => e.CreatedAtUtc).Select(e => (Guid?)e.Id).FirstOrDefault());
}
