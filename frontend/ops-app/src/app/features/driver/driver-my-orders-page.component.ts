import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { DriverAssignedOrderListItemResponse } from '../../core/models/driver.models';
import { OrderStatus } from '../../core/models/restaurant.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { toOrderStatusValue } from '../../core/utils/order-status.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

interface DriverOrderAction {
  label: string;
  status: OrderStatus;
}

@Component({
  selector: 'app-driver-my-orders-page',
  standalone: true,
  imports: [PageHeaderComponent, CurrencyPipe, DatePipe, ReactiveFormsModule, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Driver"
        title="Mis pedidos"
        subtitle="Lista real de pedidos asignados con cambios de estado basicos."
      />

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="message success">{{ successMessage() }}</div>
      }

      <form class="filters-grid" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
        <div class="field search-field">
          <label for="myOrderSearch">Buscar pedido</label>
          <input
            id="myOrderSearch"
            type="search"
            formControlName="q"
            placeholder="Restaurante o direccion"
            autocomplete="off"
          />
        </div>

        <div class="field">
          <label for="myOrderStatus">Estado</label>
          <select id="myOrderStatus" formControlName="status">
            <option value="">Todos</option>
            <option value="Assigned">Assigned</option>
            <option value="PickedUp">PickedUp</option>
            <option value="OnTheWay">OnTheWay</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div class="page-actions compact">
          <button class="button" type="submit" [disabled]="isLoading() || !!actionOrderId()">Aplicar</button>
          <button class="button ghost" type="button" (click)="clearFilters()" [disabled]="isLoading() || !!actionOrderId()">
            Limpiar
          </button>
        </div>
      </form>

      <app-notice
        tone="info"
        title="Siguiente accion"
        message="Un pedido Assigned debe marcarse como PickedUp antes de poder marcarlo como Delivered."
      />

      @if (isLoading()) {
        <div class="message">Cargando pedidos asignados...</div>
      } @else if (!orders().length) {
        <div class="message">Todavia no tienes pedidos asignados.</div>
      } @else {
        <div class="list">
          @for (order of orders(); track order.id) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ order.restaurantName }}</strong>
                  <span class="muted">{{ order.deliveryAddress }}</span>
                  <span class="muted">Pedido {{ order.id.slice(0, 8) }}</span>
                </div>

                <div class="stack align-end">
                  <app-status-badge [status]="order.status" />
                  <strong>{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  <span class="muted">{{ order.createdAtUtc | date: 'medium' }}</span>
                </div>
              </div>

              <div class="meta-grid">
                <div class="meta-item">
                  <span class="muted">Listo desde</span>
                  <strong>{{ order.readyAtUtc ? (order.readyAtUtc | date: 'shortTime') : 'Pendiente' }}</strong>
                </div>
                <div class="meta-item">
                  <span class="muted">Recogido</span>
                  <strong>{{ order.pickedUpAtUtc ? (order.pickedUpAtUtc | date: 'shortTime') : 'Pendiente' }}</strong>
                </div>
              </div>

              @if (getActions(order.status).length) {
                <div class="inline-actions">
                  @for (action of getActions(order.status); track action.label) {
                    <button
                      class="button primary-action"
                      type="button"
                      (click)="updateStatus(order, action)"
                      [disabled]="actionOrderId() === order.id"
                    >
                      {{ actionOrderId() === order.id ? 'Procesando...' : action.label }}
                    </button>
                  }
                </div>
              } @else {
                <app-notice
                  tone="info"
                  title="Sin accion pendiente"
                  message="Este pedido no tiene una siguiente accion disponible para el driver en su estado actual."
                />
              }
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class DriverMyOrdersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<DriverAssignedOrderListItemResponse[]>([]);
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

  getActions(status: string): DriverOrderAction[] {
    switch (status) {
      case 'Assigned':
        return [{ label: 'Marcar recogido', status: 'PickedUp' }];
      case 'PickedUp':
        return [{ label: 'Marcar entregado', status: 'Delivered' }];
      default:
        return [];
    }
  }

  updateStatus(order: DriverAssignedOrderListItemResponse, action: DriverOrderAction): void {
    this.actionOrderId.set(order.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.driverOrdersApi
      .updateMyOrderStatus(order.id, { status: toOrderStatusValue(action.status) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Pedido ${order.id.slice(0, 8)} actualizado a ${action.status}.`);
          this.actionOrderId.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar el pedido ${order.id.slice(0, 8)}.`));
          this.actionOrderId.set(null);
        },
      });
  }
}
