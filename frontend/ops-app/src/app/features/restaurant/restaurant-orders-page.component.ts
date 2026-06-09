import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  CircleSlash,
  CookingPot,
  FilterX,
  LucideAngularModule,
  ReceiptText,
  Search,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { OrderStatus, RestaurantOrderListItemResponse } from '../../core/models/restaurant.models';
import { RestaurantOrdersApiService } from '../../core/services/restaurant-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { toOrderStatusValue } from '../../core/utils/order-status.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

interface RestaurantOrderAction {
  label: string;
  status: OrderStatus;
  variant?: 'danger';
}

@Component({
  selector: 'app-restaurant-orders-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Restaurant"
          title="Pedidos del restaurante"
          subtitle="Gestiona el tramo operativo real desde que entra el pedido hasta que queda listo para pickup."
        />

        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {{ successMessage() }}
          </div>
        }

        <div class="stats-grid">
          <app-metric-card label="Pedidos" [value]="orders().length" helper="Resultados visibles en la lista" />
          <app-metric-card label="Pendientes" [value]="ordersByStatus('Pending')" helper="Aun sin aceptar" />
          <app-metric-card label="Preparando" [value]="ordersByStatus('Preparing')" helper="En cocina ahora" />
          <app-metric-card label="Listos pickup" [value]="ordersByStatus('ReadyForPickup')" helper="Esperando recoleccion" />
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]">
        <form class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Buscar pedido</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="restaurantOrderSearch"
                type="search"
                formControlName="q"
                placeholder="Cliente, telefono o direccion"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
              />
            </div>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Estado</span>
            <select id="restaurantOrderStatus" formControlName="status">
              <option value="">Todos</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="ReadyForPickup">ReadyForPickup</option>
              <option value="Assigned">Assigned</option>
              <option value="PickedUp">PickedUp</option>
              <option value="OnTheWay">OnTheWay</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <div class="flex flex-wrap items-end gap-3 xl:justify-end">
            <app-button type="submit" [disabled]="isLoading() || !!actionOrderId()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button variant="ghost" type="button" (click)="clearFilters()" [disabled]="isLoading() || !!actionOrderId()">
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
        </form>
      </app-surface-card>

      <app-notice
        tone="info"
        title="Flujo permitido"
        message="Los pedidos avanzan Pending -> Accepted -> Preparing -> ReadyForPickup. Solo puedes cancelar antes de que esten listos para pickup."
      />

      @if (isLoading()) {
        <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-text-muted">
          Cargando pedidos...
        </div>
      } @else if (!orders().length) {
        <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-4 text-sm font-semibold text-text-muted">
          No hay pedidos para mostrar en este momento.
        </div>
      } @else {
        <div class="grid gap-4">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="page">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ order.customerName }}</strong>
                      <span class="text-sm text-text-muted">Pedido {{ shortId(order.id) }}</span>
                      <span class="text-sm text-text-muted">{{ order.createdAtUtc | date: 'medium' }}</span>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="order.status" />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                        Total
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="truckIcon" aria-hidden="true"></lucide-angular>
                        Pago
                      </div>
                      <p class="mt-2 text-sm font-bold text-loreto-carbon">{{ order.paymentMethod }}</p>
                    </div>
                  </div>

                  @if (getActions(order.status).length) {
                    <div class="flex flex-wrap gap-3">
                      @for (action of getActions(order.status); track action.label) {
                        <app-button
                          [variant]="action.variant === 'danger' ? 'danger' : 'primary'"
                          size="lg"
                          type="button"
                          (click)="updateStatus(order, action)"
                          [disabled]="actionOrderId() === order.id"
                        >
                          @if (action.variant === 'danger') {
                            <lucide-angular class="h-4 w-4" [img]="cancelIcon" aria-hidden="true"></lucide-angular>
                          } @else if (action.status === 'Preparing') {
                            <lucide-angular class="h-4 w-4" [img]="cookingIcon" aria-hidden="true"></lucide-angular>
                          } @else {
                            <lucide-angular class="h-4 w-4" [img]="shieldIcon" aria-hidden="true"></lucide-angular>
                          }
                          {{ actionOrderId() === order.id ? 'Procesando...' : action.label }}
                        </app-button>
                      }
                    </div>
                  } @else {
                    <app-notice
                      tone="info"
                      title="Sin acciones disponibles"
                      message="Este pedido ya esta fuera del tramo operativo que puede modificar el restaurante."
                    />
                  }
                </div>
              </div>
            </app-surface-card>
          }
        </div>
      }
    </section>
  `,
})
export class RestaurantOrdersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly restaurantOrdersApi = inject(RestaurantOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly receiptIcon = ReceiptText;
  readonly walletIcon = Wallet;
  readonly truckIcon = Truck;
  readonly cookingIcon = CookingPot;
  readonly shieldIcon = ShieldCheck;
  readonly cancelIcon = CircleSlash;

  readonly orders = signal<RestaurantOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
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

  ordersByStatus(status: string): number {
    return this.orders().filter((order) => order.status === status).length;
  }

  loadOrders(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.restaurantOrdersApi
      .getOrders({
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
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los pedidos.'));
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

  shortId(id: string): string {
    return id.slice(0, 8);
  }

  getActions(status: string): RestaurantOrderAction[] {
    switch (status) {
      case 'Pending':
        return [
          { label: 'Aceptar', status: 'Accepted' },
          { label: 'Cancelar', status: 'Cancelled', variant: 'danger' },
        ];
      case 'Accepted':
        return [
          { label: 'Marcar preparando', status: 'Preparing' },
          { label: 'Cancelar', status: 'Cancelled', variant: 'danger' },
        ];
      case 'Preparing':
        return [
          { label: 'Listo para pickup', status: 'ReadyForPickup' },
          { label: 'Cancelar', status: 'Cancelled', variant: 'danger' },
        ];
      default:
        return [];
    }
  }

  updateStatus(order: RestaurantOrderListItemResponse, action: RestaurantOrderAction): void {
    this.actionOrderId.set(order.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.restaurantOrdersApi
      .updateOrderStatus(order.id, { status: toOrderStatusValue(action.status) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Pedido ${this.shortId(order.id)} actualizado a ${action.status}.`);
          this.actionOrderId.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar el pedido ${this.shortId(order.id)}.`));
          this.actionOrderId.set(null);
        },
      });
  }
}
