import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertCircle, CircleDollarSign, LucideAngularModule, ReceiptText, WalletCards } from 'lucide-angular';
import { FinancialMovement } from '../../core/models/admin-finance.models';
import { AdminFinanceApiService } from '../../core/services/admin-finance-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { ActionChipRowComponent } from '../../shared/components/action-chip-row.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-admin-commissions-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideAngularModule,
    ActionChipRowComponent,
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
          title="Comisiones"
          subtitle="Controla ingresos AppuraPe, deudas por efectivo y movimientos listos para liquidar."
          [meta]="movements().length + ' movimientos'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <div class="mt-5 grid gap-3 min-[390px]:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="moneyIcon" aria-hidden="true"></lucide-angular>
              Pendientes
            </div>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ summary().pendingAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            <p class="text-xs text-slate-500">{{ summary().pendingCount }} movimientos generados</p>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="walletIcon" aria-hidden="true"></lucide-angular>
              Disponibles
            </div>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ summary().availableAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            <p class="text-xs text-slate-500">{{ summary().availableCount }} listos para liquidar</p>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
              Liquidado
            </div>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ summary().settledAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            <p class="text-xs text-slate-500">Historial pagado</p>
          </article>

          <article class="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
              <lucide-angular class="h-4 w-4" [img]="alertIcon" aria-hidden="true"></lucide-angular>
              Deuda por efectivo
            </div>
            <p class="mt-2 text-2xl font-black text-amber-900">{{ summary().cashDebtAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            <p class="text-xs text-amber-700">{{ summary().cashDebtCount }} deudas pendientes</p>
          </article>
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4">
        <app-action-chip-row>
          @for (option of statusOptions; track option.value) {
            <button
              type="button"
              class="min-h-11 rounded-full border px-4 text-sm font-extrabold transition"
              [class.border-primary-500]="selectedStatus() === option.value"
              [class.bg-primary-50]="selectedStatus() === option.value"
              [class.text-primary-700]="selectedStatus() === option.value"
              [class.border-slate-200]="selectedStatus() !== option.value"
              [class.bg-white]="selectedStatus() !== option.value"
              [class.text-slate-600]="selectedStatus() !== option.value"
              (click)="selectStatus(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </app-action-chip-row>
      </app-surface-card>

      @if (isLoading()) {
        <app-unified-loading-state label="Cargando comisiones" />
      } @else if (!movements().length) {
        <app-unified-empty-state title="Sin movimientos" message="Cuando existan comisiones, servicios o deudas apareceran aqui.">
          <app-button type="button" variant="secondary" (click)="load()">Recargar</app-button>
        </app-unified-empty-state>
      } @else {
        <div class="grid gap-4">
          @for (movement of movements(); track movement.id) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-primary-700">{{ movementTypeLabel(movement.type) }}</p>
                  <h3 class="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">{{ movement.amount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</h3>
                  <p class="mt-1 text-sm leading-6 text-slate-500">
                    {{ movement.restaurantName || movement.userFullName || 'Movimiento AppuraPe' }}
                  </p>
                </div>
                <app-status-badge [status]="movement.status" [label]="movementStatusLabel(movement.status)" />
              </div>

              <div class="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 min-[390px]:grid-cols-2">
                <span>Fecha: <strong class="text-slate-900">{{ movement.occurredAtUtc | date: 'short' }}</strong></span>
                <span>Origen: <strong class="text-slate-900">{{ movementSourceLabel(movement) }}</strong></span>
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
                @if (movement.status !== 'Settled' && movement.status !== 'Cancelled') {
                  <app-button type="button" variant="ghost" size="sm" [loading]="processingId() === movement.id" (click)="waiveMovement(movement)">
                    Exonerar
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
export class AdminCommissionsPageComponent {
  private readonly financeApi = inject(AdminFinanceApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly moneyIcon = CircleDollarSign;
  readonly walletIcon = WalletCards;
  readonly receiptIcon = ReceiptText;
  readonly alertIcon = AlertCircle;

  readonly statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendientes', value: 'Pending' },
    { label: 'Disponibles', value: 'Available' },
    { label: 'Liquidadas', value: 'Settled' },
    { label: 'Canceladas', value: 'Cancelled' },
  ];

  readonly summary = signal({
    pendingAmount: 0,
    availableAmount: 0,
    settledAmount: 0,
    cashDebtAmount: 0,
    pendingCount: 0,
    availableCount: 0,
    cashDebtCount: 0,
  });
  readonly movements = signal<FinancialMovement[]>([]);
  readonly selectedStatus = signal('');
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly processingId = signal('');
  readonly visibleTotal = computed(() => this.movements().reduce((sum, movement) => sum + movement.amount, 0));

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.financeApi.getCommissionSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (summary) => this.summary.set(summary),
      error: (error) => this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el resumen de comisiones.')),
    });
    this.financeApi.getFinancialMovements({ status: this.selectedStatus() || undefined }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (movements) => {
        this.movements.set(movements);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los movimientos financieros.'));
        this.isLoading.set(false);
      },
    });
  }

  selectStatus(status: string): void {
    this.selectedStatus.set(status);
    this.load();
  }

  waiveMovement(movement: FinancialMovement): void {
    if (!confirm('¿Exonerar este movimiento?')) {
      return;
    }

    this.processingId.set(movement.id);
    this.financeApi.waiveMovement(movement.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.processingId.set('');
        this.notificationService.success('Movimiento exonerado.');
        this.load();
      },
      error: (error) => {
        this.processingId.set('');
        this.notificationService.error(getErrorMessage(error, 'No se pudo exonerar el movimiento.'));
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
      CashOrderDebt: 'Deuda pendiente por efectivo',
      CollaboratorVerificationFee: 'Verificacion de colaborador',
      BusinessNetAmount: 'Neto del negocio',
      CourierEarning: 'Ganancia del driver',
    };

    return labels[type] ?? 'Movimiento financiero';
  }

  movementStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Available: 'Disponible',
      Settled: 'Liquidada',
      Cancelled: 'Cancelada',
      Refunded: 'Reembolsada',
    };

    return labels[status] ?? status;
  }

  movementSourceLabel(movement: FinancialMovement): string {
    if (movement.orderId) {
      return `Pedido #${movement.orderId.slice(0, 8).toUpperCase()}`;
    }

    if (movement.communityRequestId) {
      return `Favor #${movement.communityRequestId.slice(0, 8).toUpperCase()}`;
    }

    return movement.reference ?? 'Registro manual';
  }
}
