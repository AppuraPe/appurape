import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { CustomerOrderListItemResponse } from '../../core/models/orders.models';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, CurrencyPipe, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page-shell main-stack">
      <div class="hero-card">
        <app-page-header
          eyebrow="Pedidos"
          title="Mis pedidos"
          subtitle="Consulta tus pedidos creados en AppuraPe, revisa estado, total y detalle de entrega."
        />
      </div>

      @if (errorMessage()) {
        <div class="alert error">
          <strong class="alert-title">No pudimos cargar tus pedidos</strong>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      @if (isLoading()) {
        <div class="app-card loading-state">
          <span class="eyebrow">Cargando historial</span>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
        </div>
      } @else if (!orders().length) {
        <div class="empty-state">
          <div class="empty-state-icon">P</div>
          <h2>Aun no tienes pedidos</h2>
          <p class="muted">Cuando crees tu primer pedido desde el detalle de un restaurante, podras seguirlo aqui.</p>
          <a class="button" routerLink="/restaurants">Explorar restaurantes</a>
        </div>
      } @else {
        <section class="app-card filter-panel">
          <div class="section-heading">
            <div>
              <h2>Filtra tu historial</h2>
              <p class="muted">Busca por restaurante o estado para ubicar pedidos mas rapido.</p>
            </div>
            <button class="button subtle" type="button" (click)="clearFilters()" [disabled]="!hasActiveFilters()">
              Limpiar filtros
            </button>
          </div>

          <div class="filters-grid filters-grid--single">
            <div class="field search-field">
              <label for="ordersSearch">Buscar pedidos</label>
              <input
                id="ordersSearch"
                type="search"
                [formControl]="searchControl"
                placeholder="Busca por restaurante o estado"
                autocomplete="off"
              />
              <span class="field-hint">Ejemplos: Appura Burgers, Entregado, Pendiente.</span>
            </div>
          </div>

          <div class="chip-row" aria-label="Filtrar por estado">
            <button
              class="filter-chip"
              type="button"
              [class.active]="!selectedStatus()"
              (click)="selectStatus('')"
            >
              Todos
            </button>
            @for (status of availableStatuses(); track status) {
              <button
                class="filter-chip"
                type="button"
                [class.active]="selectedStatus() === status"
                (click)="selectStatus(status)"
              >
                {{ readableStatus(status) }}
              </button>
            }
          </div>
        </section>

        @if (!filteredOrders().length) {
          <div class="empty-state">
            <div class="empty-state-icon">F</div>
            <h2>No encontramos pedidos con esos filtros</h2>
            <p class="muted">Prueba con otro restaurante, cambia el estado o limpia los filtros para ver todo tu historial.</p>
            <button class="button" type="button" (click)="clearFilters()">Mostrar todos mis pedidos</button>
          </div>
        } @else {
          <div class="section-heading">
            <div>
              <h2>Historial reciente</h2>
              <p class="muted">{{ resultsSummary() }}</p>
            </div>
            <a class="button ghost" routerLink="/restaurants">Crear otro pedido</a>
          </div>

          <div class="list">
            @for (order of filteredOrders(); track order.id) {
              <article class="app-card">
                <div class="order-row">
                  <div>
                    <span [attr.class]="'badge ' + statusClass(order.status)">{{ readableStatus(order.status) }}</span>
                    <h2 style="margin-top: 0.75rem;">{{ order.restaurantName }}</h2>
                    <p class="muted">Pedido {{ order.id }}</p>
                  </div>

                  <div style="text-align: right;">
                    <div class="price">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</div>
                    <p class="muted">{{ order.createdAtUtc | date: 'medium' }}</p>
                  </div>
                </div>

                <div class="meta-grid" style="margin-top: 1rem;">
                  <div class="meta-item">
                    <span>Subtotal</span>
                    <strong>{{ order.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                  <div class="meta-item">
                    <span>Delivery</span>
                    <strong>{{ order.deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                  <div class="meta-item">
                    <span>Pago</span>
                    <strong>{{ order.paymentMethod }}</strong>
                  </div>
                </div>

                <div class="button-row" style="margin-top: 1rem;">
                  <a class="button primary-action" [routerLink]="['/orders', order.id]">Ver seguimiento y detalle</a>
                </div>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
})
export class MyOrdersPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<CustomerOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedStatus = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly availableStatuses = computed(() => {
    const statuses = new Set(this.orders().map((order) => order.status));
    const knownStatuses = this.statusOrder().filter((status) => statuses.has(status));
    const extraStatuses = Array.from(statuses)
      .filter((status) => !knownStatuses.includes(status))
      .sort((left, right) => left.localeCompare(right));

    return [...knownStatuses, ...extraStatuses];
  });
  readonly filteredOrders = computed(() => {
    const searchTerm = this.normalizeSearchTerm(this.searchTerm());
    const selectedStatus = this.selectedStatus();

    return this.orders().filter((order) => {
      const matchesStatus = !selectedStatus || order.status === selectedStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        this.normalizeSearchTerm(order.restaurantName).includes(searchTerm) ||
        this.normalizeSearchTerm(order.status).includes(searchTerm) ||
        this.normalizeSearchTerm(this.readableStatus(order.status)).includes(searchTerm)
      );
    });
  });
  readonly hasActiveFilters = computed(() => hasText(this.searchTerm()) || hasText(this.selectedStatus()));
  readonly resultsSummary = computed(() => {
    const count = this.filteredOrders().length;
    const label = count === 1 ? '1 pedido coincide con tu filtro.' : `${count} pedidos coinciden con tu filtro.`;

    if (!this.hasActiveFilters()) {
      return `${this.orders().length} pedido(s) asociados a tu cuenta.`;
    }

    return label;
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.getRawValue()),
        debounceTime(250),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.searchTerm.set(value.trim());
      });

    this.ordersApi
      .getMyOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Revisa tu sesion o intenta nuevamente.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedStatus.set('');
  }

  selectStatus(status: string): void {
    this.selectedStatus.set(status);
  }

  readableStatus(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Accepted: 'Aceptado',
      Preparing: 'En preparacion',
      ReadyForPickup: 'Listo para recoger',
      Assigned: 'Repartidor asignado',
      PickedUp: 'En camino',
      Delivered: 'Entregado',
      Cancelled: 'Cancelado',
    };

    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      Pending: 'warning',
      Accepted: 'info',
      Preparing: 'info',
      ReadyForPickup: 'success',
      Assigned: 'info',
      PickedUp: 'info',
      Delivered: 'success',
      Cancelled: 'danger',
    };

    return classes[status] ?? 'neutral';
  }

  private statusOrder(): string[] {
    return ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'Delivered', 'Cancelled'];
  }

  private normalizeSearchTerm(value: string): string {
    return value.trim().toLocaleLowerCase();
  }
}
