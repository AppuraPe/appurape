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
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-7xl content-start gap-4 overflow-x-hidden lg:gap-6 pt-2'">
      <header class="grid gap-3 px-0.5">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <app-internal-page-section-header
            eyebrow="Administración de Finanzas"
            title="Validación de Pagos Manuales"
            subtitle="Revisa y concilia los comprobantes de Yape y Plin antes de autorizar el pedido."
          />
          <button type="button" class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-primary-700 shadow-sm transition active:scale-95 hover:bg-slate-50 disabled:opacity-50" (click)="loadPayments()" [disabled]="isLoading()" aria-label="Actualizar pagos">
            <lucide-angular class="h-4.5 w-4.5" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
          </button>
        </div>

        @if (errorMessage()) {
          <app-notice tone="danger" [message]="errorMessage()" />
        } @else {
          <app-notice tone="warning" title="Revisión obligatoria" message="Comprueba que el número de operación y la captura coincidan con el abono real en la cuenta de la empresa." />
        }
      </header>

      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de pagos pendientes">
        <button type="button" (click)="selectedMethod.set('all')" class="min-w-0 rounded-3xl p-5 text-left transition shadow-sm border" [class]="selectedMethod() === 'all' ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
          <p class="truncate text-[11px] font-black uppercase tracking-wider text-slate-500">Total Pendientes</p>
          <p class="mt-2 text-3xl font-black leading-none text-slate-900">{{ payments().length }}</p>
          <p class="mt-2 truncate text-xs font-bold text-primary-700">Ver todos</p>
        </button>
        <button type="button" (click)="selectedMethod.set('Yape')" class="min-w-0 rounded-3xl p-5 text-left transition shadow-sm border" [class]="selectedMethod() === 'Yape' ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
          <p class="truncate text-[11px] font-black uppercase tracking-wider text-purple-700">Yape</p>
          <p class="mt-2 text-3xl font-black leading-none text-purple-800">{{ paymentsByMethod('Yape') }}</p>
          <p class="mt-2 truncate text-xs font-bold text-purple-700">Filtrar por Yape</p>
        </button>
        <button type="button" (click)="selectedMethod.set('Plin')" class="min-w-0 rounded-3xl p-5 text-left transition shadow-sm border" [class]="selectedMethod() === 'Plin' ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
          <p class="truncate text-[11px] font-black uppercase tracking-wider text-sky-700">Plin</p>
          <p class="mt-2 text-3xl font-black leading-none text-sky-800">{{ paymentsByMethod('Plin') }}</p>
          <p class="mt-2 truncate text-xs font-bold text-sky-700">Filtrar por Plin</p>
        </button>
        <div class="min-w-0 rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
          <p class="truncate text-[11px] font-black uppercase tracking-wider text-slate-500">Monto total en cola</p>
          <p class="mt-2 truncate text-2xl font-black leading-none text-slate-900">{{ totalPendingAmount() | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
          <p class="mt-2 truncate text-xs font-semibold text-slate-500">Por conciliar</p>
        </div>
      </section>

      @if (isLoading()) {
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-label="Cargando pagos pendientes" aria-busy="true">
          @for (skeleton of [1, 2, 3, 4, 5, 6]; track skeleton) {
            <div class="h-44 animate-pulse rounded-3xl border border-slate-200 bg-white p-5"><div class="h-3 w-2/5 rounded-full bg-slate-200"></div><div class="mt-3 h-6 w-1/3 rounded-xl bg-slate-100"></div><div class="mt-6 h-10 rounded-2xl bg-slate-100"></div></div>
          }
        </div>
      } @else if (errorMessage()) {
        <app-unified-empty-state title="No se pudieron cargar los pagos" message="Intenta nuevamente para revisar la bandeja.">
          <app-button type="button" variant="secondary" (click)="loadPayments()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!filteredPayments().length) {
        <app-unified-empty-state title="No hay pagos pendientes con este filtro" message="Cuando existan pagos manuales por revisar aparecerán aquí.">
          <app-button type="button" variant="secondary" (click)="selectedMethod.set('all'); loadPayments()">Ver todos los pagos</app-button>
        </app-unified-empty-state>
      } @else {
        <section class="grid gap-3" aria-labelledby="pending-payments-list-title">
          <div class="flex items-center justify-between px-1">
            <h2 id="pending-payments-list-title" class="text-base font-black tracking-tight text-slate-950">Comprobantes por revisar ({{ filteredPayments().length }})</h2>
          </div>
          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          @for (payment of filteredPayments(); track payment.orderId) {
            <article class="grid min-w-0 gap-3.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md">
              <div class="flex min-w-0 items-start gap-3">
                <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-sm">
                  <lucide-angular class="h-6 w-6" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="min-w-0 flex-1">
                  <span class="truncate text-xs font-bold text-slate-400 uppercase tracking-wider">#{{ shortOrderId(payment.orderId) }}</span>
                  <strong class="mt-0.5 block truncate text-xl font-black text-slate-900">{{ payment.total | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
                  <p class="mt-0.5 truncate text-xs font-semibold text-slate-600">{{ payment.businessName }}</p>
                </div>
              </div>

              <div class="flex min-w-0 items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div class="min-w-0 text-xs text-slate-500">
                  <p class="truncate font-bold text-slate-800">{{ paymentMethodLabel(payment.paymentMethod) }}</p>
                  <p class="mt-0.5 flex items-center gap-1.5 truncate text-[11px]"><lucide-angular class="h-3.5 w-3.5 shrink-0 text-slate-400" [img]="calendarIcon" aria-hidden="true"></lucide-angular>{{ payment.createdAtUtc | date: 'short' }}</p>
                </div>
                <app-button variant="secondary" size="sm" [routerLink]="['/admin/payments', payment.orderId]">Revisar</app-button>
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
  readonly selectedMethod = signal<'all' | 'Yape' | 'Plin'>('all');
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly totalPendingAmount = computed(() => this.payments().reduce((sum, payment) => sum + payment.total, 0));
  readonly filteredPayments = computed(() => {
    const method = this.selectedMethod();
    if (method === 'all') return this.payments();
    return this.payments().filter((payment) => payment.paymentMethod === method);
  });

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

  shortOrderId(id: string): string {
    if (!id) return '';
    return id.slice(0, 8).toUpperCase();
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
