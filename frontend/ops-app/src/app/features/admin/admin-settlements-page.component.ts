import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CheckCircle2, LucideAngularModule, ReceiptText, WalletCards, XCircle } from 'lucide-angular';
import { FinancialObligation, LegacyMovement, SettlementBatch } from '../../core/models/admin-finance.models';
import { RefundResponse } from '../../core/models/orders.models';
import { AdminFinanceApiService } from '../../core/services/admin-finance-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-admin-settlements-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    InternalPageSectionHeaderComponent,
    MobilePageShellComponent,
    StatusBadgeComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden lg:gap-6'">
      <app-surface-card variant="page" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="Admin"
          title="Liquidaciones"
          subtitle="Agrupa movimientos disponibles y marca pagos manuales cuando AppuraPe liquide al negocio, driver o colaborador."
          [meta]="settlements().length + ' liquidaciones'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <app-notice
          class="mt-4"
          tone="info"
          title="Liquidacion manual"
          message="Esta vista no mueve dinero automaticamente. Solo registra el control operativo de lo pagado por administracion."
        />
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <h2 class="text-lg font-black text-slate-950">Conciliación histórica</h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">Los registros anteriores a FinanceV2 están congelados hasta que un administrador deje una decisión auditada.</p>
        @if (legacyMovements().length) {
          <div class="mt-4 grid gap-3">
            @for (movement of legacyMovements(); track movement.id) {
              <div class="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div class="min-w-0 text-sm"><strong class="block text-slate-950">{{ movement.reference || movement.type }}</strong><span class="text-slate-500">{{ movement.amount | currency: movement.currencyCode : 'S/ ' : '1.2-2' }} · requiere conciliación</span></div>
                <div class="flex flex-wrap gap-2">
                  <app-button type="button" size="sm" variant="secondary" (click)="reconcile(movement, 'Reconocido')">Reconocer</app-button>
                  <app-button type="button" size="sm" variant="ghost" (click)="reconcile(movement, 'Cancelado')">Cancelar registro</app-button>
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="mt-3 text-sm text-slate-500">No hay movimientos históricos pendientes.</p>
        }
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <h2 class="text-lg font-black text-slate-950">Reembolsos en disputa</h2>
        <p class="mt-1 text-sm text-slate-500">Resolver exige un motivo auditado; completar genera reversos u obligaciones compensatorias.</p>
        @if (disputedRefunds().length) {
          <div class="mt-4 grid gap-3">
            @for (refund of disputedRefunds(); track refund.id) {
              <div class="grid gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div class="min-w-0 text-sm"><strong class="block text-slate-950">Pedido #{{ refund.orderId.slice(0, 8) }}</strong><span class="break-words text-slate-600">{{ refund.amount | currency: refund.currencyCode : 'S/ ' : '1.2-2' }} · {{ refund.reason }}</span></div>
                <div class="flex flex-wrap gap-2"><app-button type="button" size="sm" (click)="resolveRefund(refund, true)">Confirmar devolución</app-button><app-button type="button" size="sm" variant="ghost" (click)="resolveRefund(refund, false)">Rechazar</app-button></div>
              </div>
            }
          </div>
        } @else { <p class="mt-3 text-sm text-slate-500">No hay reembolsos en disputa.</p> }
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <h2 class="text-lg font-black tracking-[-0.03em] text-slate-950">Crear liquidacion</h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">Selecciona obligaciones del mismo deudor y acreedor. El pago necesitará aprobación y verificación de administradores distintos.</p>

        <div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <strong class="block text-slate-900">Contraparte automática</strong>
            Se obtiene del deudor y acreedor de las obligaciones seleccionadas.
          </div>

          <label class="grid gap-2 text-sm font-bold text-slate-700">
            Nota
            <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-primary-500" [(ngModel)]="notes" placeholder="Pago semanal, corte manual..." />
          </label>
        </div>

        <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.14em] text-primary-700">Seleccionado</p>
              <p class="mt-1 text-xl font-black text-slate-950">{{ selectedTotal() | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            </div>
            <app-button type="button" size="md" [disabled]="!selectedObligationIds().length || isCreating()" [loading]="isCreating()" (click)="createSettlement()">
              Crear
            </app-button>
          </div>
        </div>

        @if (availableObligations().length) {
          <div class="mt-4 grid gap-3">
            @for (obligation of availableObligations(); track obligation.id) {
              <label class="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <input type="checkbox" class="h-5 w-5 accent-primary-600" [checked]="isSelected(obligation.id)" (change)="toggleObligation(obligation)" />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-black text-slate-950">{{ obligationConceptLabel(obligation.concept) }}</span>
                  <span class="block break-words text-xs leading-5 text-slate-500">{{ partyLabel(obligation.debtorType) }} → {{ partyLabel(obligation.creditorType) }} · {{ obligation.reference }}</span>
                </span>
                <strong class="text-sm text-slate-950">{{ obligation.amount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
              </label>
            }
          </div>
        } @else {
          <p class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
            No hay movimientos disponibles para liquidar.
          </p>
        }
      </app-surface-card>

      @if (isLoading()) {
        <app-unified-loading-state label="Cargando liquidaciones" />
      } @else if (!settlements().length) {
        <app-unified-empty-state title="Sin liquidaciones" message="Las liquidaciones creadas manualmente apareceran aqui.">
          <app-button type="button" variant="secondary" (click)="load()">Recargar</app-button>
        </app-unified-empty-state>
      } @else {
        <div class="grid gap-4">
          @for (settlement of settlements(); track settlement.id) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-primary-700">{{ targetTypeLabel(settlement.targetType) }}</p>
                  <h3 class="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">{{ settlement.grossAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</h3>
                  <p class="mt-1 text-sm leading-6 text-slate-500">{{ settlement.businessName || settlement.collaboratorName || 'Liquidacion manual' }}</p>
                </div>
                <app-status-badge [status]="settlement.status" [label]="settlementStatusLabel(settlement.status)" />
              </div>

              <div class="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 min-[390px]:grid-cols-2">
                <span>Creada: <strong class="text-slate-900">{{ settlement.createdAtUtc | date: 'short' }}</strong></span>
                <span>Items: <strong class="text-slate-900">{{ settlement.items.length }}</strong></span>
                <span>Comisión: <strong class="text-slate-900">{{ settlement.commissionAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong></span>
                <span>Servicio: <strong class="text-slate-900">{{ settlement.serviceFeeAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong></span>
              </div>

              <div class="mt-4 flex flex-wrap justify-end gap-2">
                @if (settlement.status === 'Pending') {
                  <app-button type="button" variant="success" size="sm" [loading]="processingId() === settlement.id" (click)="approveSettlement(settlement)">
                    <lucide-angular class="h-4 w-4" [img]="paidIcon" aria-hidden="true"></lucide-angular>
                    Aprobar
                  </app-button>
                }
                @if (settlement.status === 'PaymentReported') {
                  <app-button type="button" variant="secondary" size="sm" (click)="viewSettlementEvidence(settlement.id)">Ver comprobante</app-button>
                  <app-button type="button" variant="success" size="sm" [loading]="processingId() === settlement.id" (click)="markPaid(settlement)">
                    Verificar y cerrar
                  </app-button>
                }
                @if (settlement.status !== 'Paid' && settlement.status !== 'Cancelled') {
                  <app-button type="button" variant="ghost" size="sm" [loading]="processingId() === settlement.id" (click)="cancelSettlement(settlement)">
                    <lucide-angular class="h-4 w-4" [img]="cancelIcon" aria-hidden="true"></lucide-angular>
                    Cancelar
                  </app-button>
                }
              </div>

              @if (settlement.status === 'Approved') {
                <div class="mt-4 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p class="text-sm font-bold text-amber-950">Registra la transferencia después de realizarla</p>
                  <input class="min-h-11 rounded-xl border border-amber-200 bg-white px-3 text-sm" [(ngModel)]="paymentOperation" placeholder="Número de operación" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" class="w-full min-w-0 text-sm" (change)="onPaymentFileSelected($event)" />
                  <app-button type="button" size="sm" [disabled]="!paymentOperation.trim() || !paymentFile" [loading]="processingId() === settlement.id" (click)="reportPayment(settlement)">Reportar pago</app-button>
                </div>
              }
            </app-surface-card>
          }
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class AdminSettlementsPageComponent {
  private readonly financeApi = inject(AdminFinanceApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly walletIcon = WalletCards;
  readonly receiptIcon = ReceiptText;
  readonly paidIcon = CheckCircle2;
  readonly cancelIcon = XCircle;

  readonly settlements = signal<SettlementBatch[]>([]);
  readonly availableObligations = signal<FinancialObligation[]>([]);
  readonly legacyMovements = signal<LegacyMovement[]>([]);
  readonly disputedRefunds = signal<RefundResponse[]>([]);
  readonly selectedObligationIds = signal<string[]>([]);
  readonly isLoading = signal(true);
  readonly isCreating = signal(false);
  readonly processingId = signal('');
  readonly errorMessage = signal('');
  readonly selectedObligations = computed(() => this.availableObligations().filter((item) => this.selectedObligationIds().includes(item.id)));
  readonly selectedTotal = computed(() => this.selectedObligations().reduce((sum, item) => sum + item.amount, 0));

  targetType = 0;
  notes = '';
  paymentOperation = '';
  paymentFile: File | null = null;

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.financeApi.getSettlements().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (settlements) => {
        this.settlements.set(settlements);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar las liquidaciones.'));
        this.isLoading.set(false);
      },
    });
    this.financeApi.getFinancialObligations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.availableObligations.set(items.filter((item) => item.status === 'Available')),
      error: (error) => this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar obligaciones disponibles.')),
    });
    this.financeApi.getLegacyReconciliation().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.legacyMovements.set(items),
      error: (error) => this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar la conciliación histórica.')),
    });
    this.financeApi.getDisputedRefunds().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.disputedRefunds.set(items),
      error: (error) => this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los reembolsos en disputa.')),
    });
  }

  isSelected(id: string): boolean {
    return this.selectedObligationIds().includes(id);
  }

  toggleObligation(item: FinancialObligation): void {
    const current = this.selectedObligationIds();
    if (current.includes(item.id)) {
      this.selectedObligationIds.set(current.filter((id) => id !== item.id));
      return;
    }
    const first = this.selectedObligations()[0];
    if (first && (first.debtorType !== item.debtorType || first.debtorEntityId !== item.debtorEntityId || first.creditorType !== item.creditorType || first.creditorEntityId !== item.creditorEntityId || first.currencyCode !== item.currencyCode)) {
      this.notificationService.warning('Agrupa únicamente obligaciones del mismo deudor, acreedor y moneda.');
      return;
    }
    this.selectedObligationIds.set([...current, item.id]);
  }

  createSettlement(): void {
    if (!this.selectedObligationIds().length) {
      return;
    }

    this.isCreating.set(true);
    const first = this.selectedObligations()[0];
    const targetType = first.debtorType === 'Platform' ? first.creditorType : first.debtorType;
    const targetId = first.debtorType === 'Platform' ? first.creditorEntityId : first.debtorEntityId;
    if (!targetId || !['Business', 'Driver', 'Collaborator'].includes(targetType)) {
      this.isCreating.set(false);
      this.notificationService.error('La obligación no tiene una contraparte liquidable válida.');
      return;
    }
    const now = new Date();
    this.financeApi.createSettlement({
      targetType: targetType === 'Business' ? 0 : targetType === 'Driver' ? 1 : 2,
      businessId: targetType === 'Business' ? targetId : undefined,
      driverId: targetType === 'Driver' ? targetId : undefined,
      collaboratorUserId: targetType === 'Collaborator' ? targetId : undefined,
      periodStartUtc: new Date(Math.min(...this.selectedObligations().map((item) => new Date(item.availableAtUtc ?? 0).getTime())) - 1000).toISOString(),
      periodEndUtc: now.toISOString(),
      financialMovementIds: [],
      financialObligationIds: this.selectedObligationIds(),
      notes: this.notes.trim() || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Liquidacion creada.');
        this.selectedObligationIds.set([]);
        this.notes = '';
        this.isCreating.set(false);
        this.load();
      },
      error: (error) => {
        this.isCreating.set(false);
        this.notificationService.error(getErrorMessage(error, 'No se pudo crear la liquidacion.'));
      },
    });
  }

  markPaid(settlement: SettlementBatch): void {
    if (!confirm('¿Marcar esta liquidacion como pagada?')) {
      return;
    }

    this.processingId.set(settlement.id);
    this.financeApi.markSettlementPaid(settlement.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Liquidacion pagada.');
        this.processingId.set('');
        this.load();
      },
      error: (error) => {
        this.processingId.set('');
        this.notificationService.error(getErrorMessage(error, 'No se pudo marcar como pagada.'));
      },
    });
  }

  approveSettlement(settlement: SettlementBatch): void {
    if (!confirm('¿Aprobar esta liquidación? Debes ser un administrador distinto de quien la creó.')) return;
    this.processingId.set(settlement.id);
    this.financeApi.approveSettlement(settlement.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.processingId.set('');
        this.notificationService.success('Liquidación aprobada.');
        this.load();
      },
      error: (error) => {
        this.processingId.set('');
        this.notificationService.error(getErrorMessage(error, 'No se pudo aprobar la liquidación.'));
      },
    });
  }

  onPaymentFileSelected(event: Event): void {
    this.paymentFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  reportPayment(settlement: SettlementBatch): void {
    if (!this.paymentFile || !this.paymentOperation.trim()) return;
    this.processingId.set(settlement.id);
    this.financeApi.reportSettlementPayment(settlement.id, this.paymentOperation.trim(), settlement.grossAmount, new Date().toISOString(), this.paymentFile)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.processingId.set('');
          this.paymentOperation = '';
          this.paymentFile = null;
          this.notificationService.success('Transferencia reportada. Otro administrador debe verificarla.');
          this.load();
        },
        error: (error) => {
          this.processingId.set('');
          this.notificationService.error(getErrorMessage(error, 'No se pudo registrar la transferencia.'));
        },
      });
  }

  viewSettlementEvidence(settlementId: string): void {
    this.financeApi.downloadSettlementPaymentEvidence(settlementId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (error) => this.notificationService.error(getErrorMessage(error, 'No se pudo abrir el comprobante privado.')),
    });
  }

  cancelSettlement(settlement: SettlementBatch): void {
    if (!confirm('¿Cancelar esta liquidacion?')) {
      return;
    }

    this.processingId.set(settlement.id);
    this.financeApi.cancelSettlement(settlement.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Liquidacion cancelada.');
        this.processingId.set('');
        this.load();
      },
      error: (error) => {
        this.processingId.set('');
        this.notificationService.error(getErrorMessage(error, 'No se pudo cancelar la liquidacion.'));
      },
    });
  }

  reconcile(movement: LegacyMovement, decision: 'Reconocido' | 'Cancelado'): void {
    const reason = prompt(`Motivo para marcar el movimiento como ${decision.toLowerCase()}:`)?.trim();
    if (!reason || reason.length < 5) {
      this.notificationService.warning('Ingresa un motivo de al menos 5 caracteres.');
      return;
    }
    this.financeApi.reconcileLegacyMovement(movement.id, decision, reason).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Movimiento histórico conciliado.');
        this.load();
      },
      error: (error) => this.notificationService.error(getErrorMessage(error, 'No se pudo conciliar el movimiento.')),
    });
  }

  resolveRefund(refund: RefundResponse, complete: boolean): void {
    const reason = prompt(complete ? 'Motivo y evidencia revisada para confirmar la devolución:' : 'Motivo para rechazar la devolución:')?.trim();
    if (!reason || reason.length < 10) {
      this.notificationService.warning('Ingresa un motivo de al menos 10 caracteres.');
      return;
    }
    this.financeApi.resolveRefund(refund.id, complete, reason).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.notificationService.success('Disputa resuelta con auditoría.'); this.load(); },
      error: (error) => this.notificationService.error(getErrorMessage(error, 'No se pudo resolver el reembolso.')),
    });
  }

  obligationConceptLabel(type: string): string {
    const labels: Record<string, string> = {
      PlatformRevenueCustody: 'Ingreso de AppuraPe en custodia',
      BusinessNetCustody: 'Neto pendiente del negocio',
      CourierEarningCustody: 'Ganancia pendiente del reparto',
      FavorPlatformFeeCustody: 'Servicio AppuraPe del favor',
      RefundCompensation: 'Compensación por reembolso',
      ManualAdjustment: 'Ajuste conciliado',
    };
    return labels[type] ?? 'Obligación financiera';
  }

  partyLabel(type: string): string {
    return ({ Business: 'Negocio', Driver: 'Driver', Collaborator: 'Colaborador', Platform: 'AppuraPe' } as Record<string, string>)[type] ?? type;
  }

  targetTypeLabel(targetType: string): string {
    const labels: Record<string, string> = {
      Business: 'Negocio',
      Driver: 'Driver',
      Collaborator: 'Colaborador',
    };

    return labels[targetType] ?? targetType;
  }

  settlementStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Draft: 'Borrador',
      Pending: 'Pendiente de aprobación',
      Approved: 'Aprobada',
      PaymentReported: 'Pago reportado',
      Paid: 'Pagada',
      Cancelled: 'Cancelada',
    };

    return labels[status] ?? status;
  }
}
