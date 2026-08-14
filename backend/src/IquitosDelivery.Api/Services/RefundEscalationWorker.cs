using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IquitosDelivery.Api.Services;

public sealed class RefundEscalationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefundEscalationWorker> _logger;

    public RefundEscalationWorker(IServiceScopeFactory scopeFactory, ILogger<RefundEscalationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var cutoff = DateTime.UtcNow.AddHours(-48);
                var expired = await db.RefundRequests.Where(x => x.Status == RefundStatus.AwaitingCustomerConfirmation &&
                    x.BusinessReportedAtUtc.HasValue && x.BusinessReportedAtUtc <= cutoff).ToListAsync(stoppingToken);
                foreach (var refund in expired)
                {
                    refund.Status = RefundStatus.Disputed;
                    refund.DisputedAtUtc = DateTime.UtcNow;
                    refund.ResolutionReason = "El cliente no confirmó la devolución dentro de 48 horas.";
                }
                if (expired.Count != 0) await db.SaveChangesAsync(stoppingToken);
                if (expired.Count != 0) _logger.LogWarning("FinanceV2 escalated {RefundCount} overdue refunds to dispute.", expired.Count);

                var overdueObligations = await db.FinancialObligations.CountAsync(x =>
                    x.Status == FinancialObligationStatus.Available && x.DueAtUtc.HasValue && x.DueAtUtc < DateTime.UtcNow, stoppingToken);
                var paymentsUnderReview = await db.Payments.CountAsync(x => x.Status == PaymentStatus.UnderReview, stoppingToken);
                if (overdueObligations != 0 || paymentsUnderReview != 0)
                    _logger.LogWarning("FinanceV2 attention required: {OverdueObligations} overdue obligations and {PaymentsUnderReview} payments under review.",
                        overdueObligations, paymentsUnderReview);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex) { _logger.LogError(ex, "Error escalating overdue refunds."); }
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }
}
