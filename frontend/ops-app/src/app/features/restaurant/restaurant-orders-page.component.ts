import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderStatus, RestaurantOrderListItemResponse } from '../../core/models/restaurant.models';
import { RestaurantOrdersApiService } from '../../core/services/restaurant-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

interface RestaurantOrderAction {
  label: string;
  status: OrderStatus;
  variant?: 'danger';
}

@Component({
  selector: 'app-restaurant-orders-page',
  standalone: true,
  imports: [PageHeaderComponent, CurrencyPipe, DatePipe, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Pedidos"
        title="Pedidos del restaurante"
        subtitle="Lista real de pedidos con cambios de estado basicos."
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
        title="Flujo permitido"
        message="Los pedidos avanzan Pending -> Accepted -> Preparing -> ReadyForPickup. Solo puedes cancelar antes de que esten listos para pickup."
      />

      @if (isLoading()) {
        <div class="message">Cargando pedidos...</div>
      } @else if (!orders().length) {
        <div class="message">No hay pedidos para mostrar en este momento.</div>
      } @else {
        <div class="list">
          @for (order of orders(); track order.id) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ order.customerName }}</strong>
                  <span class="muted">Pedido {{ shortId(order.id) }}</span>
                  <span class="muted">{{ order.createdAtUtc | date: 'medium' }}</span>
                </div>

                <div class="stack align-end">
                  <app-status-badge [status]="order.status" />
                  <strong>{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  <span class="muted">Pago: {{ order.paymentMethod }}</span>
                </div>
              </div>

              @if (getActions(order.status).length) {
                <div class="inline-actions">
                  @for (action of getActions(order.status); track action.label) {
                    <button
                      class="button primary-action"
                      [class.danger]="action.variant === 'danger'"
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
                  title="Sin acciones disponibles"
                  message="Este pedido ya esta fuera del tramo operativo que puede modificar el restaurante."
                />
              }
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class RestaurantOrdersPageComponent {
  private readonly restaurantOrdersApi = inject(RestaurantOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<RestaurantOrderListItemResponse[]>([]);
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

    this.restaurantOrdersApi
      .getOrders()
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
      .updateOrderStatus(order.id, { status: action.status })
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
