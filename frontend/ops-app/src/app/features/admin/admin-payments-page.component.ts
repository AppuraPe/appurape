import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CalendarClock, CreditCard, LucideAngularModule, ShieldCheck, Store, UserRound, Wallet } from 'lucide-angular';
import { AdminPaymentListItem } from '../../core/models/admin-payments.models';
import { AdminPaymentsApiService } from '../../core/services/admin-payments-api.service';
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
  selector: 'app-admin-payments-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    StatusBadgeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    ActionChipRowComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(88px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4 lg:gap-6'">
      <app-surface-card variant="page" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="Admin"
          title="Pagos pendientes"
          subtitle="Confirma o rechaza los pagos manuales antes de que el negocio continúe con el flujo operativo."
          [meta]="payments().length + ' pendientes'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <app-notice
          class="mt-4"
          tone="warning"
          title="Yape y Plin requieren revisión"
          message="Solo los pedidos con pago manual pendiente aparecen aquí. Los pedidos Cash no forman parte de esta bandeja."
        />

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Pendientes</p>
            <p class="mt-2 text-2xl font-black leading-none text-slate-950">{{ payments().length }}</p>
            <p class="mt-1 text-xs text-slate-500">Pagos manuales por revisar</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Yape</p>
            <p class="mt-2 text-2xl font-black leading-none text-primary-700">{{ paymentsByMethod('Yape') }}</p>
            <p class="mt-1 text-xs text-slate-500">Pagos pendientes por Yape</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Plin</p>
            <p class="mt-2 text-2xl font-black leading-none text-primary-700">{{ paymentsByMethod('Plin') }}</p>
            <p class="mt-1 text-xs text-slate-500">Pagos pendientes por Plin</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Monto total</p>
            <p class="mt-2 text-xl font-black leading-none text-slate-950">{{ totalPendingAmount() | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
            <p class="mt-1 text-xs text-slate-500">Suma de pagos pendientes</p>
          </div>
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <app-action-chip-row>
          @for (method of ['Yape', 'Plin']; track method) {
            <span class="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
              {{ method }}
            </span>
          }
        </app-action-chip-row>
      </app-surface-card>

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando pagos pendientes" />
          <app-unified-loading-state label="Preparando revisión" />
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
        <div class="grid gap-4">
          @for (payment of payments(); track payment.orderId) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1 min-w-0">
                      <strong class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Pedido {{ payment.orderCode }}</strong>
                      <span class="text-sm text-slate-500">{{ payment.createdAtUtc | date: 'medium' }}</span>
                      <span class="text-sm text-slate-500">{{ payment.customerName }}</span>
                      <span class="text-sm text-slate-500">{{ payment.businessName }}</span>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="payment.orderStatus" [label]="orderStatusLabel(payment.orderStatus)" prefix="Pedido" />
                    <app-status-badge [status]="payment.paymentStatus" [label]="paymentStatusLabel(payment.paymentStatus)" prefix="Pago" />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="userIcon" aria-hidden="true"></lucide-angular>
                        Cliente
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-950">{{ payment.customerName }}</p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="creditCardIcon" aria-hidden="true"></lucide-angular>
                        Método
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-950">{{ paymentMethodLabel(payment.paymentMethod) }}</p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                        Total
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-950">{{ payment.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                      <lucide-angular class="h-4 w-4 text-primary-700" [img]="calendarIcon" aria-hidden="true"></lucide-angular>
                      {{ payment.createdAtUtc | date: 'medium' }}
                    </div>
                    <app-button variant="secondary" size="md" [routerLink]="['/admin/payments', payment.orderId]">
                      Ver detalle
                    </app-button>
                  </div>
                </div>
              </div>
            </app-surface-card>
          }
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class AdminPaymentsPageComponent {
  private readonly adminPaymentsApi = inject(AdminPaymentsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly walletIcon = Wallet;
  readonly creditCardIcon = CreditCard;
  readonly storeIcon = Store;
  readonly userIcon = UserRound;
  readonly calendarIcon = CalendarClock;
  readonly shieldIcon = ShieldCheck;

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
