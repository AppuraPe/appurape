import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bike, Clock3, FilterX, LucideAngularModule, PackageCheck, Search, Truck, Wallet } from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { BusinessOrderStatus } from '../../core/models/business.model';
import { DriverAssignedOrderListItemResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
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

interface DriverOrderAction {
  label: string;
  status: BusinessOrderStatus;
}

@Component({
  selector: 'app-driver-my-orders-page',
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
          eyebrow="Driver"
          title="Mis pedidos"
          subtitle="Pedidos asignados con seguimiento claro de cada siguiente acción."
          [meta]="orders().length + ' activos'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Pedidos</p>
            <p class="mt-2 text-2xl font-black leading-none text-slate-950">{{ orders().length }}</p>
            <p class="mt-1 text-xs text-slate-500">Asignados a tu cuenta</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Con acción</p>
            <p class="mt-2 text-2xl font-black leading-none text-primary-700">{{ ordersWithActionsCount() }}</p>
            <p class="mt-1 text-xs text-slate-500">Tienen un siguiente paso disponible</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Filtro</p>
            <p class="mt-2 text-xl font-black leading-none text-slate-950">{{ readableOrderStatus(filtersForm.controls.status.value || 'Todos') }}</p>
            <p class="mt-1 text-xs text-slate-500">Estado visible actual</p>
          </div>
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <form class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-slate-900">Buscar pedido</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="myOrderSearch"
                type="search"
                formControlName="q"
                placeholder="Negocio o dirección"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 text-sm text-slate-900 shadow-none focus:ring-0"
              />
            </div>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-slate-900">Estado</span>
            <select id="myOrderStatus" formControlName="status" class="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15">
              <option value="">Todos</option>
              <option value="Assigned">Repartidor asignado</option>
              <option value="PickedUp">Recogido</option>
              <option value="OnTheWay">En camino</option>
              <option value="Delivered">Entregado</option>
              <option value="Cancelled">Cancelado</option>
            </select>
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

        <app-action-chip-row class="mt-4">
          @for (status of ['Assigned', 'PickedUp', 'OnTheWay', 'Delivered', 'Cancelled']; track status) {
            <button
              class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition"
              [class]="filtersForm.controls.status.value === status ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'"
              type="button"
              (click)="filtersForm.controls.status.setValue(status)"
            >
              {{ readableOrderStatus(status) }}
            </button>
          }
        </app-action-chip-row>
      </app-surface-card>

      <app-notice
        tone="info"
        title="Siguiente acción"
        message="Un pedido Assigned pasa a PickedUp, luego OnTheWay y finalmente Delivered."
      />

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando pedidos asignados" />
          <app-unified-loading-state label="Actualizando entrega" />
        </div>
      } @else if (errorMessage() && !orders().length) {
        <app-unified-empty-state title="No pudimos cargar tus pedidos" message="Intenta nuevamente para revisar tus entregas.">
          <app-button type="button" variant="secondary" (click)="loadOrders()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!orders().length) {
        <app-unified-empty-state title="Todavía no tienes pedidos asignados" message="Cuando tomes una entrega aparecerá aquí con su siguiente acción."></app-unified-empty-state>
      } @else {
        <div class="grid gap-4">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="truckIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1 min-w-0">
                      <strong class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">{{ order.restaurantName }}</strong>
                      <span class="text-sm text-slate-500">{{ order.customerName }}</span>
                      <span class="text-sm text-slate-500">{{ order.deliveryAddress }}</span>
                      <span class="text-sm text-slate-500">Pedido {{ order.orderCode.slice(0, 8) }}</span>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                        Listo desde
                      </div>
                      <p class="mt-2 text-sm font-semibold text-slate-950">{{ order.readyAtUtc ? (order.readyAtUtc | date: 'shortTime') : 'Pendiente' }}</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="packageIcon" aria-hidden="true"></lucide-angular>
                        Recogido
                      </div>
                      <p class="mt-2 text-sm font-semibold text-slate-950">{{ order.pickedUpAtUtc ? (order.pickedUpAtUtc | date: 'shortTime') : 'Pendiente' }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
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
                        <lucide-angular class="h-4 w-4" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                        Creado
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-950">{{ order.createdAtUtc | date: 'medium' }}</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <app-button variant="secondary" size="md" [routerLink]="['/driver/orders', order.id]">
                      Ver detalle
                    </app-button>

                    @if (getActions(order.status).length) {
                      <div class="flex flex-wrap gap-3">
                        @for (action of getActions(order.status); track action.label) {
                          <app-button size="md" type="button" [disabled]="actionOrderId() === order.id" (click)="updateStatus(order, action)">
                            {{ actionOrderId() === order.id ? 'Procesando...' : action.label }}
                          </app-button>
                        }
                      </div>
                    } @else {
                      <app-notice
                        tone="info"
                        title="Sin acción pendiente"
                        message="Este pedido no tiene una siguiente acción disponible para el driver en su estado actual."
                      />
                    }
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
export class DriverMyOrdersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly truckIcon = Truck;
  readonly packageIcon = PackageCheck;
  readonly clockIcon = Clock3;
  readonly walletIcon = Wallet;
  readonly bikeIcon = Bike;

  readonly orders = signal<DriverAssignedOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly actionOrderId = signal<string | null>(null);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    status: [''],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadOrders();
    });

    this.loadOrders();
  }

  ordersWithActionsCount(): number {
    return this.orders().filter((order) => this.getActions(order.status).length > 0).length;
  }

  loadOrders(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.driverOrdersApi
      .getMyOrders({
        q: filters.q,
        status: filters.status || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar tus pedidos.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
        status: '',
      },
      { emitEvent: false },
    );
    this.loadOrders();
  }

  readableOrderStatus(status: string): string {
    switch (status) {
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
      case 'Todos':
        return 'Todos';
      default:
        return status;
    }
  }

  getActions(status: string): DriverOrderAction[] {
    switch (status) {
      case 'Assigned':
        return [{ label: 'Marcar como recogido', status: 'PickedUp' }];
      case 'PickedUp':
        return [{ label: 'Marcar en camino', status: 'OnTheWay' }];
      case 'OnTheWay':
        return [{ label: 'Marcar entregado', status: 'Delivered' }];
      default:
        return [];
    }
  }

  updateStatus(order: DriverAssignedOrderListItemResponse, action: DriverOrderAction): void {
    this.actionOrderId.set(order.id);
    this.errorMessage.set('');

    const request$ =
      action.status === 'PickedUp'
        ? this.driverOrdersApi.markPickedUp(order.id)
        : action.status === 'OnTheWay'
          ? this.driverOrdersApi.markOnTheWay(order.id)
          : this.driverOrdersApi.markDelivered(order.id);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.success(this.successMessageFor(action.status));
          this.actionOrderId.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la entrega. Intenta nuevamente.'));
          this.actionOrderId.set(null);
          if (error?.status === 403) {
            this.notificationService.error('No tienes permisos para gestionar esta entrega.');
            return;
          }
          this.notificationService.error('No se pudo actualizar la entrega. Intenta nuevamente.');
        },
      });
  }

  private successMessageFor(status: BusinessOrderStatus): string {
    switch (status) {
      case 'PickedUp':
        return 'Pedido recogido.';
      case 'OnTheWay':
        return 'Pedido en camino.';
      case 'Delivered':
        return 'Pedido entregado correctamente.';
      default:
        return 'Entrega actualizada.';
    }
  }
}
