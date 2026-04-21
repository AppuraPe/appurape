import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerOrderListItemResponse } from '../../core/models/orders.models';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, CurrencyPipe, DatePipe],
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
        <div class="section-heading">
          <div>
            <h2>Historial reciente</h2>
            <p class="muted">{{ orders().length }} pedido(s) asociados a tu cuenta.</p>
          </div>
          <a class="button ghost" routerLink="/restaurants">Crear otro pedido</a>
        </div>

        <div class="list">
          @for (order of orders(); track order.id) {
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
    </section>
  `,
})
export class MyOrdersPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<CustomerOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
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
}
