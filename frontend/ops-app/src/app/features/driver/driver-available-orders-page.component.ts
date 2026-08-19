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
    UnifiedEmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-4 overflow-x-hidden pt-2 lg:gap-5'">
      <header class="px-2">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-black text-slate-900">Disponibles <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-500">{{ orders().length }}</span></h1>
            <!-- Pequeña ayuda visual en vez de header gigante -->
        </div>
        <p class="mt-1 text-sm text-slate-500">Evalúa la ruta y tu ganancia</p>

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }
      </header>

      <form class="grid w-full min-w-0 max-w-full gap-2 px-2 xl:grid-cols-[minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid min-w-0">
            <span class="sr-only">Buscar pedido</span>
            <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
              <lucide-angular class="h-5 w-5 text-slate-400" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="availableOrderSearch"
                type="search"
                formControlName="q"
                placeholder="Negocio, dirección o zona"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 text-base text-slate-900 shadow-none focus:ring-0 w-full"
              />
            </div>
          </label>

          <div class="grid grid-cols-2 gap-2 xl:flex xl:justify-end">
            <app-button size="md" type="submit" [disabled]="isLoading() || !!actionOrderId()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button size="md" variant="secondary" type="button" [disabled]="isLoading() || !!actionOrderId()" (click)="clearFilters()">
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
      </form>

      @if (isLoading()) {
        <div class="grid gap-3 px-2" aria-label="Cargando pedidos disponibles" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 shrink-0 rounded-xl bg-slate-200"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="h-2.5 w-1/2 rounded-full bg-slate-100"></div>
                </div>
              </div>
              <div class="mt-4 h-10 w-full rounded-xl bg-slate-100"></div>
            </div>
          }
        </div>
      } @else if (errorMessage() && !orders().length) {
        <div class="px-2">
           <app-unified-empty-state title="No pudimos cargar los pedidos" message="Intenta nuevamente para ver los pedidos disponibles.">
             <app-button type="button" variant="secondary" (click)="loadOrders()">Reintentar</app-button>
           </app-unified-empty-state>
        </div>
      } @else if (!orders().length) {
        <div class="px-2">
           <app-unified-empty-state title="No hay pedidos disponibles" message="Vuelve a intentar en unos minutos o recarga la lista."></app-unified-empty-state>
        </div>
      } @else {
        <div class="grid gap-4 px-2">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-4 sm:p-5 shadow-sm ring-1 ring-slate-200 border-0">
              <div class="grid min-w-0 gap-4">
                <!-- CABECERA DE LA TARJETA -->
                <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div class="min-w-0">
                    <strong class="block truncate text-lg font-black tracking-tight text-slate-900" [title]="order.restaurantName">{{ order.restaurantName }}</strong>
                    <p class="mt-0.5 truncate text-xs font-semibold text-slate-500">{{ order.zoneName }} · {{ order.createdAtUtc | date: 'shortTime' }}</p>
                  </div>
                  <div class="shrink-0 text-right bg-emerald-50 px-3 py-1.5 rounded-xl">
                    <p class="text-[10px] font-black uppercase tracking-wider text-emerald-700">Tu ganancia</p>
                    <p class="whitespace-nowrap text-2xl font-black tabular-nums text-emerald-700 leading-none">{{ order.courierEarningAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
                  </div>
                </div>

                <!-- DETALLE RUTA -->
                <div class="grid min-w-0 gap-3 border-t border-slate-100 pt-3 text-sm">
                  <div class="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-2">
                    <lucide-angular class="mt-0.5 h-4 w-4 text-orange-500" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                    <p class="line-clamp-2 break-words text-slate-600"><strong class="text-slate-900">Recoge:</strong> {{ order.pickupAddress }}</p>
                  </div>
                  <div class="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-2">
                    <lucide-angular class="mt-0.5 h-4 w-4 text-primary-600" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    <p class="line-clamp-2 break-words text-slate-600"><strong class="text-slate-900">Entrega:</strong> {{ order.deliveryAddress }}</p>
                  </div>
                </div>

                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{{ paymentMethodLabel(order.paymentMethod) }}</span>
                </div>

                <!-- ACCIONES (Arreglo Fat-Finger) -->
                <div class="grid gap-2 pt-2">
                    <app-button size="lg" type="button" [disabled]="actionOrderId() === order.id" (click)="takeOrder(order)" block>
                      {{ actionOrderId() === order.id ? 'Procesando...' : 'Aceptar Entrega' }}
                    </app-button>
                    <a [routerLink]="['/driver/orders', order.id]" class="block text-center text-sm font-bold text-slate-500 py-3 no-underline transition active:bg-slate-50 active:text-primary-700 rounded-xl">
                      Ver detalle de la ruta
                    </a>
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
