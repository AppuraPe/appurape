import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CalendarClock, LucideAngularModule, RefreshCw, Wallet } from 'lucide-angular';
import { AdminPaymentListItem } from '../../core/models/admin-payments.models';
import { AdminPaymentsApiService } from '../../core/services/admin-payments-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';

@Component({
  selector: 'app-admin-payments-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-5xl content-start gap-3.5 overflow-x-hidden lg:gap-4'">
      <header class="grid gap-3 px-0.5">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <app-internal-page-section-header
            eyebrow="Administración"
            title="Pagos pendientes"
            subtitle="Revisa los pagos manuales antes de continuar el pedido."
          />
          <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-primary-700 shadow-sm active:scale-95 disabled:opacity-50" (click)="loadPayments()" [disabled]="isLoading()" aria-label="Actualizar pagos">
            <lucide-angular class="h-4 w-4" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
          </button>
        </div>

        @if (errorMessage()) {
          <app-notice tone="danger" [message]="errorMessage()" />
        } @else {
          <app-notice tone="warning" title="Revisión manual" message="Comprueba el pago por Yape o Plin antes de confirmarlo." />
        }
      </header>

      <section class="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Resumen de pagos pendientes">
        <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
          <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Pendientes</p>
          <p class="mt-1.5 text-2xl font-black leading-none text-slate-950">{{ payments().length }}</p>
          <p class="mt-1 truncate text-xs font-semibold text-slate-500">Por revisar</p>
        </div>
        <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
          <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Yape</p>
          <p class="mt-1.5 text-2xl font-black leading-none text-primary-700">{{ paymentsByMethod('Yape') }}</p>
          <p class="mt-1 truncate text-xs font-semibold text-slate-500">Pendientes</p>
        </div>
        <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
          <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Plin</p>
          <p class="mt-1.5 text-2xl font-black leading-none text-primary-700">{{ paymentsByMethod('Plin') }}</p>
          <p class="mt-1 truncate text-xs font-semibold text-slate-500">Pendientes</p>
        </div>
        <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
          <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Monto total</p>
          <p class="mt-1.5 truncate text-lg font-black leading-none text-slate-950">{{ totalPendingAmount() | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
          <p class="mt-1 truncate text-xs font-semibold text-slate-500">Acumulado</p>
        </div>
      </section>

      @if (isLoading()) {
        <div class="grid gap-2 md:grid-cols-2" aria-label="Cargando pagos pendientes" aria-busy="true">
          @for (skeleton of [1, 2, 3, 4]; track skeleton) {
            <div class="h-[154px] animate-pulse rounded-2xl border border-slate-200 bg-white p-4"><div class="h-3 w-2/5 rounded-full bg-slate-200"></div><div class="mt-3 h-6 w-1/3 rounded-lg bg-slate-100"></div><div class="mt-5 h-10 rounded-xl bg-slate-100"></div></div>
          }
        </div>
      } @else if (errorMessage()) {
        <app-unified-empty-state title="No se pudieron cargar los pagos" message="Intenta nuevamente para revisar la bandeja.">
          <app-button type="button" variant="secondary" (click)="loadPayments()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!payments().length) {
        <app-unified-empty-state title="No hay pagos pendientes" message="Cuando existan pagos manuales por revisar aparecerán aquí.">
          <app-button type="button" variant="secondary" (click)="loadPayments()">Recargar</app-button>
        </app-unified-empty-state>
      } @else {
        <section class="grid gap-2.5" aria-labelledby="pending-payments-list-title">
          <h2 id="pending-payments-list-title" class="px-1 text-sm font-black tracking-[-0.02em] text-slate-950">Pedidos por revisar</h2>
          <div class="grid gap-2.5 md:grid-cols-2">
          @for (payment of payments(); track payment.orderId) {
            <article class="grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex min-w-0 items-start gap-3">
                <div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-700 text-white">
                  <lucide-angular class="h-5 w-5" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black text-slate-950">Pedido {{ payment.orderCode }}</p>
                  <p class="mt-0.5 truncate text-xs font-semibold text-slate-600">{{ payment.businessName }}</p>
                  <p class="truncate text-xs text-slate-500">Cliente: {{ payment.customerName }}</p>
                </div>
                <strong class="shrink-0 whitespace-nowrap text-base font-black text-primary-700">{{ payment.total | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
              </div>

              <div class="flex min-w-0 flex-wrap gap-1.5">
                <app-status-badge [status]="payment.paymentStatus" [label]="paymentStatusLabel(payment.paymentStatus)" prefix="Pago" />
                <app-status-badge [status]="payment.orderStatus" [label]="orderStatusLabel(payment.orderStatus)" prefix="Pedido" />
              </div>

              <div class="flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div class="min-w-0 text-xs text-slate-500">
                  <p class="truncate font-bold text-slate-700">{{ paymentMethodLabel(payment.paymentMethod) }}</p>
                  <p class="mt-0.5 flex items-center gap-1.5 truncate"><lucide-angular class="h-3.5 w-3.5 shrink-0 text-primary-700" [img]="calendarIcon" aria-hidden="true"></lucide-angular>{{ payment.createdAtUtc | date: 'short' }}</p>
                </div>
                <app-button variant="secondary" size="sm" [routerLink]="['/admin/payments', payment.orderId]">Ver detalle</app-button>
              </div>
            </article>
          }
          </div>
        </section>
      }
    </app-mobile-page-shell>
  `,
})
export class AdminPaymentsPageComponent {
  private readonly adminPaymentsApi = inject(AdminPaymentsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly walletIcon = Wallet;
  readonly calendarIcon = CalendarClock;
  readonly refreshIcon = RefreshCw;

  readonly payments = signal<AdminPaymentListItem[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly totalPendingAmount = computed(() => this.payments().reduce((sum, payment) => sum + payment.total, 0));

  constructor() {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminPaymentsApi
      .getPendingPayments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payments) => {
          this.payments.set(payments);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los pagos pendientes.'));
          this.isLoading.set(false);
        },
      });
  }

  paymentsByMethod(method: string): number {
    return this.payments().filter((payment) => payment.paymentMethod === method).length;
  }

  paymentStatusLabel(status: string): string {
    switch (status) {
      case 'PendingConfirmation':
        return 'Pendiente de confirmación';
      case 'Paid':
        return 'Pagado';
      case 'Rejected':
        return 'Pago rechazado';
      default:
        return status;
    }
  }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[method] ?? method;
  }

  orderStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Accepted':
        return 'Aceptado';
      case 'Preparing':
        return 'En preparación';
      case 'ReadyForPickup':
        return 'Listo para recoger';
      case 'Assigned':
        return 'Repartidor asignado';
      case 'PickedUp':
        return 'Recogido';
      case 'OnTheWay':
        return 'En camino';
      case 'Delivered':
        return 'Entregado';
      case 'Cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }
}
