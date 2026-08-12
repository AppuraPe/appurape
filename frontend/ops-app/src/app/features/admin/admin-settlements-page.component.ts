import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CheckCircle2, LucideAngularModule, ReceiptText, WalletCards, XCircle } from 'lucide-angular';
import { FinancialMovement, SettlementBatch } from '../../core/models/admin-finance.models';
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
        <h2 class="text-lg font-black tracking-[-0.03em] text-slate-950">Crear liquidacion</h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">Selecciona movimientos disponibles. Luego confirma manualmente el pago fuera de la app.</p>

        <div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            Destino
            <select class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-primary-500" [(ngModel)]="targetType">
              <option [ngValue]="0">Negocio</option>
              <option [ngValue]="1">Repartidor</option>
              <option [ngValue]="2">Colaborador</option>
            </select>
          </label>

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
            <app-button type="button" size="md" [disabled]="!selectedMovementIds().length || isCreating()" [loading]="isCreating()" (click)="createSettlement()">
              Crear
            </app-button>
          </div>
        </div>

        @if (availableMovements().length) {
          <div class="mt-4 grid gap-3">
            @for (movement of availableMovements(); track movement.id) {
              <label class="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <input type="checkbox" class="h-5 w-5 accent-primary-600" [checked]="isSelected(movement.id)" (change)="toggleMovement(movement.id)" />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-black text-slate-950">{{ movementTypeLabel(movement.type) }}</span>
                  <span class="block text-xs leading-5 text-slate-500">{{ movement.restaurantName || movement.userFullName || movement.reference || 'Movimiento disponible' }}</span>
                </span>
                <strong class="text-sm text-slate-950">{{ movement.amount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
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
                @if (settlement.status === 'Pending' || settlement.status === 'Draft') {
                  <app-button type="button" variant="success" size="sm" [loading]="processingId() === settlement.id" (click)="markPaid(settlement)">
                    <lucide-angular class="h-4 w-4" [img]="paidIcon" aria-hidden="true"></lucide-angular>
                    Pagada
                  </app-button>
                  <app-button type="button" variant="ghost" size="sm" [loading]="processingId() === settlement.id" (click)="cancelSettlement(settlement)">
                    <lucide-angular class="h-4 w-4" [img]="cancelIcon" aria-hidden="true"></lucide-angular>
                    Cancelar
                  </app-button>
                }
              </div>
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
  readonly availableMovements = signal<FinancialMovement[]>([]);
  readonly selectedMovementIds = signal<string[]>([]);
  readonly isLoading = signal(true);
  readonly isCreating = signal(false);
  readonly processingId = signal('');
  readonly errorMessage = signal('');
  readonly selectedMovements = computed(() => this.availableMovements().filter((movement) => this.selectedMovementIds().includes(movement.id)));
  readonly selectedTotal = computed(() => this.selectedMovements().reduce((sum, movement) => sum + movement.amount, 0));

  targetType = 0;
  notes = '';

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
    this.financeApi.getFinancialMovements({ status: 'Available' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (movements) => this.availableMovements.set(movements),
      error: (error) => this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar movimientos disponibles.')),
    });
  }

  isSelected(movementId: string): boolean {
    return this.selectedMovementIds().includes(movementId);
  }

  toggleMovement(movementId: string): void {
    const current = this.selectedMovementIds();
    this.selectedMovementIds.set(current.includes(movementId) ? current.filter((id) => id !== movementId) : [...current, movementId]);
  }

  createSettlement(): void {
    if (!this.selectedMovementIds().length) {
      return;
    }

    this.isCreating.set(true);
    const now = new Date();
    this.financeApi.createSettlement({
      targetType: Number(this.targetType),
      periodStartUtc: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEndUtc: now.toISOString(),
      financialMovementIds: this.selectedMovementIds(),
      notes: this.notes.trim() || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Liquidacion creada.');
        this.selectedMovementIds.set([]);
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

  movementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      BusinessCommission: 'Comisión por venta',
      BusinessOrderCommission: 'Comisión por venta',
      CommissionMovement: 'Comisión',
      DeliveryPlatformCommission: 'Comision de entrega',
      ServiceFee: 'Servicio AppuraPe',
      FavorPlatformCommission: 'Servicio de favor',
      CashOrderDebt: 'Deuda por efectivo',
      CollaboratorVerificationFee: 'Verificacion de colaborador',
      BusinessNetAmount: 'Neto del negocio',
      CourierEarning: 'Ganancia del driver',
    };

    return labels[type] ?? 'Movimiento financiero';
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
      Pending: 'Pendiente',
      Paid: 'Pagada',
      Cancelled: 'Cancelada',
    };

    return labels[status] ?? status;
  }
}
