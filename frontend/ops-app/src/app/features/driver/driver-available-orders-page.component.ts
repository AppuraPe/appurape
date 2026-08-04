import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bike, FilterX, LucideAngularModule, MapPin, ReceiptText, Search, Wallet } from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { AvailableDriverOrderListItemResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
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
  selector: 'app-driver-available-orders-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AppNoticeComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(88px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4 lg:gap-6'">
      <app-surface-card variant="page" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="Driver"
          title="Pedidos disponibles"
          subtitle="Lista real de pedidos listos para tomar dentro de tu flujo operativo."
          [meta]="orders().length + ' visibles'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Disponibles</p>
            <p class="mt-2 text-2xl font-black leading-none text-slate-950">{{ orders().length }}</p>
            <p class="mt-1 text-xs text-slate-500">Pedidos listos para asignación</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Filtrados</p>
            <p class="mt-2 text-xl font-black leading-none text-slate-950">{{ filtersForm.controls.q.value ? 'Sí' : 'No' }}</p>
            <p class="mt-1 text-xs text-slate-500">Búsqueda activa en esta lista</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Acción</p>
            <p class="mt-2 text-xl font-black leading-none text-slate-950">{{ actionOrderId() ? 'En proceso' : 'Libre' }}</p>
            <p class="mt-1 text-xs text-slate-500">Toma de pedido actual</p>
          </div>
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <form class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-slate-900">Buscar pedido</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="availableOrderSearch"
                type="search"
                formControlName="q"
                placeholder="Negocio, dirección o zona"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 text-sm text-slate-900 shadow-none focus:ring-0"
              />
            </div>
          </label>

          <div class="flex flex-wrap items-end gap-3 xl:justify-end">
            <app-button type="submit" [disabled]="isLoading() || !!actionOrderId()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button variant="secondary" type="button" [disabled]="isLoading() || !!actionOrderId()" (click)="clearFilters()">
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
        </form>
      </app-surface-card>

      <app-notice
        tone="info"
        title="Antes de tomar un pedido"
        message="El sistema solo permite tomar pedidos si tu cuenta está aprobada, estás en la zona del pedido y no tienes otro pedido activo."
      />

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando pedidos disponibles" />
          <app-unified-loading-state label="Preparando asignaciones" />
        </div>
      } @else if (errorMessage() && !orders().length) {
        <app-unified-empty-state title="No pudimos cargar los pedidos" message="Intenta nuevamente para ver los pedidos disponibles.">
          <app-button type="button" variant="secondary" (click)="loadOrders()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!orders().length) {
        <app-unified-empty-state title="No hay pedidos disponibles" message="Vuelve a intentar en unos minutos o recarga la lista."></app-unified-empty-state>
      } @else {
        <div class="grid gap-4">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1 min-w-0">
                      <strong class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">{{ order.restaurantName }}</strong>
                      <span class="text-sm text-slate-500">{{ order.customerName }}</span>
                      <span class="text-sm text-slate-500">{{ order.deliveryAddress }}</span>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                        Recojo
                      </div>
                      <p class="mt-2 text-sm font-semibold text-slate-950">{{ order.pickupAddress }}</p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                        Zona
                      </div>
                      <p class="mt-2 text-sm font-semibold text-slate-950">{{ order.zoneName }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
                    <app-status-badge [status]="order.paymentStatus" [label]="paymentStatusLabel(order.paymentStatus)" prefix="Pago" />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                        Total
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                        Pago
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-950">{{ paymentMethodLabel(order.paymentMethod) }}</p>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {{ order.createdAtUtc | date: 'medium' }}
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <app-button variant="secondary" size="md" [routerLink]="['/driver/orders', order.id]">
                      Ver detalle
                    </app-button>
                    <app-button size="md" type="button" [disabled]="actionOrderId() === order.id" (click)="takeOrder(order)">
                      {{ actionOrderId() === order.id ? 'Procesando...' : 'Aceptar entrega' }}
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
export class DriverAvailableOrdersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly bikeIcon = Bike;
  readonly mapPinIcon = MapPin;
  readonly receiptIcon = ReceiptText;
  readonly walletIcon = Wallet;

  readonly orders = signal<AvailableDriverOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly actionOrderId = signal<string | null>(null);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadOrders();
    });

    this.loadOrders();
  }

  loadOrders(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.driverOrdersApi
      .getAvailableOrders({ q: filters.q })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los pedidos disponibles.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
      },
      { emitEvent: false },
    );
    this.loadOrders();
  }

  readableOrderStatus(status: string): string {
    switch (status) {
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

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[method] ?? method;
  }

  paymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      PendingConfirmation: 'Pendiente de confirmación',
      Paid: 'Pagado',
      Rejected: 'Rechazado',
      Failed: 'Fallido',
      Refunded: 'Reembolsado',
    };

    return labels[status] ?? status;
  }

  takeOrder(order: AvailableDriverOrderListItemResponse): void {
    this.actionOrderId.set(order.id);
    this.errorMessage.set('');

    this.driverOrdersApi
      .acceptOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.success('Entrega aceptada.');
          this.actionOrderId.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la entrega. Intenta nuevamente.'));
          this.actionOrderId.set(null);
          const message = String(error?.error?.message ?? '');
          if (error?.status === 403) {
            this.notificationService.error('No tienes permisos para gestionar esta entrega.');
            return;
          }
          if (message.includes('ya fue tomado por otro repartidor')) {
            this.notificationService.warning('Este pedido ya fue tomado por otro repartidor.');
            return;
          }
          this.notificationService.error('No se pudo actualizar la entrega. Intenta nuevamente.');
        },
      });
  }
}
