import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FilterX, LucideAngularModule, MapPin, ReceiptText, Search } from 'lucide-angular';
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

@Component({
  selector: 'app-driver-available-orders-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
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
    StatusBadgeComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-3.5 overflow-x-hidden lg:gap-4'">
      <header class="grid gap-3 px-0.5">
        <app-internal-page-section-header
          eyebrow="Repartidor"
          title="Pedidos disponibles"
          subtitle="Compara la ganancia y la ruta antes de aceptar una entrega."
          [meta]="orders().length + ' visibles'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <div class="hidden">
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
      </header>

      <form class="grid w-full min-w-0 max-w-full gap-2 xl:grid-cols-[minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid min-w-0">
            <span class="sr-only">Buscar pedido</span>
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

          <div class="grid grid-cols-2 gap-2 xl:flex xl:justify-end">
            <app-button size="sm" type="submit" [disabled]="isLoading() || !!actionOrderId()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button size="sm" variant="secondary" type="button" [disabled]="isLoading() || !!actionOrderId()" (click)="clearFilters()">
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
      </form>

      <p class="px-1 text-xs leading-5 text-slate-500">Puedes aceptar una entrega si tu cuenta está aprobada y no tienes otro pedido activo.</p>

      @if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando pedidos disponibles" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-[106px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 shrink-0 rounded-xl bg-slate-200"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="h-2.5 w-1/2 rounded-full bg-slate-100"></div>
                </div>
                <div class="h-7 w-16 shrink-0 rounded-full bg-slate-100"></div>
              </div>
              <div class="mt-3 h-2.5 w-4/5 rounded-full bg-slate-100"></div>
            </div>
          }
        </div>
      } @else if (errorMessage() && !orders().length) {
        <app-unified-empty-state title="No pudimos cargar los pedidos" message="Intenta nuevamente para ver los pedidos disponibles.">
          <app-button type="button" variant="secondary" (click)="loadOrders()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!orders().length) {
        <app-unified-empty-state title="No hay pedidos disponibles" message="Vuelve a intentar en unos minutos o recarga la lista."></app-unified-empty-state>
      } @else {
        <div class="grid gap-3">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-3.5 sm:p-4">
              <div class="grid min-w-0 gap-3">
                <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div class="min-w-0">
                    <strong class="block truncate text-[15px] font-extrabold tracking-[-0.02em] text-slate-950" [title]="order.restaurantName">{{ order.restaurantName }}</strong>
                    <p class="mt-1 truncate text-xs text-slate-500">{{ order.zoneName }} · {{ order.createdAtUtc | date: 'shortTime' }}</p>
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="text-[10px] font-black uppercase tracking-[0.06em] text-emerald-700">Tu ganancia</p>
                    <p class="mt-0.5 whitespace-nowrap text-xl font-black tabular-nums text-emerald-700">{{ order.courierEarningAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
                  </div>
                </div>

                <div class="grid min-w-0 gap-2 border-t border-slate-100 pt-3 text-xs">
                  <div class="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-2">
                    <lucide-angular class="mt-0.5 h-4 w-4 text-primary-700" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                    <p class="line-clamp-2 break-words text-slate-700"><span class="font-bold text-slate-950">Recoge:</span> {{ order.pickupAddress }}</p>
                  </div>
                  <div class="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-2">
                    <lucide-angular class="mt-0.5 h-4 w-4 text-primary-700" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    <p class="line-clamp-2 break-words text-slate-700"><span class="font-bold text-slate-950">Entrega:</span> {{ order.deliveryAddress }}</p>
                  </div>
                </div>

                <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                  <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{{ paymentMethodLabel(order.paymentMethod) }}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <app-button variant="secondary" size="sm" [routerLink]="['/driver/orders', order.id]" block>
                      Ver detalle
                    </app-button>
                    <app-button size="sm" type="button" [disabled]="actionOrderId() === order.id" (click)="takeOrder(order)" block>
                      {{ actionOrderId() === order.id ? 'Procesando...' : 'Aceptar entrega' }}
                    </app-button>
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
  readonly mapPinIcon = MapPin;
  readonly receiptIcon = ReceiptText;

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
