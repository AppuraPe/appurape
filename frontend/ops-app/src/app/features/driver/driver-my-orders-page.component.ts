import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FilterX, LucideAngularModule, MapPin, Search } from 'lucide-angular';
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

interface DriverOrderAction {
  label: string;
  status: BusinessOrderStatus;
}

@Component({
  selector: 'app-driver-my-orders-page',
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
    StatusBadgeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    ActionChipRowComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-3.5 overflow-x-hidden lg:gap-4'">
      <header class="grid gap-3 px-0.5">
        <app-internal-page-section-header
          eyebrow="Repartidor"
          title="Mis entregas"
          subtitle="Continúa las entregas activas o revisa tu historial."
          [meta]="orders().length + ' visibles'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <div class="grid grid-cols-2 gap-2">
          <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
            <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Entregas</p>
            <p class="mt-1.5 text-2xl font-black leading-none text-slate-950">{{ orders().length }}</p>
            <p class="mt-1 text-xs text-slate-500">En esta lista</p>
          </div>
          <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
            <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">En curso</p>
            <p class="mt-1.5 text-2xl font-black leading-none text-primary-700">{{ ordersWithActionsCount() }}</p>
            <p class="mt-1 text-xs text-slate-500">Requieren acción</p>
          </div>
        </div>
      </header>

      <div class="grid gap-2">
        <form class="grid w-full min-w-0 max-w-full gap-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid min-w-0">
            <span class="sr-only">Buscar pedido</span>
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

          <label class="grid min-w-0">
            <span class="sr-only">Estado</span>
            <select id="myOrderStatus" formControlName="status" class="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15">
              <option value="">Todos</option>
              <option value="Assigned">Repartidor asignado</option>
              <option value="PickedUp">Recogido</option>
              <option value="OnTheWay">En camino</option>
              <option value="Delivered">Entregado</option>
              <option value="Cancelled">Cancelado</option>
            </select>
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

        <app-action-chip-row class="[contain:inline-size]" aria-label="Filtrar entregas por estado">
          <button class="min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition" [class]="!filtersForm.controls.status.value ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'" type="button" (click)="filtersForm.controls.status.setValue('')">Todos</button>
          @for (status of ['Assigned', 'PickedUp', 'OnTheWay', 'Delivered', 'Cancelled']; track status) {
            <button
              class="min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition"
              [class]="filtersForm.controls.status.value === status ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'"
              type="button"
              (click)="filtersForm.controls.status.setValue(status)"
            >
              {{ readableOrderStatus(status) }}
            </button>
          }
        </app-action-chip-row>
      </div>

      @if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando entregas" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-[102px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5">
              <div class="flex items-center gap-3"><div class="h-10 w-10 rounded-xl bg-slate-200"></div><div class="min-w-0 flex-1 space-y-2"><div class="h-3 w-2/3 rounded-full bg-slate-200"></div><div class="h-2.5 w-1/2 rounded-full bg-slate-100"></div></div></div>
              <div class="mt-3 h-2.5 w-4/5 rounded-full bg-slate-100"></div>
            </div>
          }
        </div>
      } @else if (errorMessage() && !orders().length) {
        <app-unified-empty-state title="No pudimos cargar tus pedidos" message="Intenta nuevamente para revisar tus entregas.">
          <app-button type="button" variant="secondary" (click)="loadOrders()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!orders().length) {
        <app-unified-empty-state title="Todavía no tienes pedidos asignados" message="Cuando tomes una entrega aparecerá aquí con su siguiente acción."></app-unified-empty-state>
      } @else {
        <div class="grid gap-3">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-3.5 sm:p-4">
              <div class="grid min-w-0 gap-3">
                <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div class="min-w-0">
                    <strong class="block truncate text-[15px] font-extrabold tracking-[-0.02em] text-slate-950" [title]="order.restaurantName">{{ order.restaurantName }}</strong>
                    <p class="mt-1 truncate text-xs text-slate-500">{{ order.orderCode.slice(0, 8) }} · {{ order.createdAtUtc | date: 'short' }}</p>
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="text-[10px] font-black uppercase tracking-[0.06em] text-emerald-700">Ganancia</p>
                    <p class="mt-0.5 whitespace-nowrap text-lg font-black tabular-nums text-emerald-700">{{ order.courierEarningAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
                  </div>
                </div>

                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
                  @if (order.pickedUpAtUtc) {
                    <span class="text-xs text-slate-500">Recogido {{ order.pickedUpAtUtc | date: 'shortTime' }}</span>
                  } @else if (order.readyAtUtc) {
                    <span class="text-xs text-slate-500">Listo {{ order.readyAtUtc | date: 'shortTime' }}</span>
                  }
                </div>

                <div class="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-2 border-t border-slate-100 pt-3">
                  <lucide-angular class="mt-0.5 h-4 w-4 text-primary-700" [img]="mapIcon" aria-hidden="true"></lucide-angular>
                  <p class="line-clamp-2 break-words text-xs leading-5 text-slate-600"><span class="font-bold text-slate-950">Entrega:</span> {{ order.deliveryAddress }}</p>
                </div>

                <div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <app-button variant="secondary" size="sm" [routerLink]="['/driver/orders', order.id]" block>Ver detalle</app-button>

                  @if (getActions(order.status).length) {
                    @for (action of getActions(order.status); track action.label) {
                      <app-button size="sm" type="button" [disabled]="actionOrderId() === order.id" (click)="updateStatus(order, action)" block>
                        {{ actionOrderId() === order.id ? 'Procesando...' : compactActionLabel(action.status) }}
                      </app-button>
                    }
                  } @else {
                    <span class="flex min-h-9 items-center justify-center rounded-xl bg-slate-50 px-2 text-center text-xs font-semibold text-slate-500">{{ terminalStatusLabel(order.status) }}</span>
                  }
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
  readonly mapIcon = MapPin;

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
        return 'En proceso';
    }
  }

  compactActionLabel(status: BusinessOrderStatus): string {
    switch (status) {
      case 'PickedUp':
        return 'Confirmar recojo';
      case 'OnTheWay':
        return 'Iniciar ruta';
      case 'Delivered':
        return 'Confirmar entrega';
      default:
        return 'Continuar';
    }
  }

  terminalStatusLabel(status: string): string {
    return status === 'Cancelled' ? 'Entrega cancelada' : 'Entrega finalizada';
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
