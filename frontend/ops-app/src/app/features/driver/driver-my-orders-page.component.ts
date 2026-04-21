import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriverAssignedOrderListItemResponse } from '../../core/models/driver.models';
import { OrderStatus } from '../../core/models/restaurant.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
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
  imports: [PageHeaderComponent, CurrencyPipe, DatePipe, AppNoticeComponent, StatusBadgeComponent],
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

      <div class="page-actions">
        <button class="button ghost" type="button" (click)="loadOrders()" [disabled]="isLoading() || !!actionOrderId()">
          Recargar
        </button>
      </div>

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
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<DriverAssignedOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly actionOrderId = signal<string | null>(null);

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.driverOrdersApi
      .getMyOrders()
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
      .updateMyOrderStatus(order.id, { status: action.status })
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
