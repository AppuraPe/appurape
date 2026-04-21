import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerOrderDetailResponse } from '../../core/models/orders.models';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-my-order-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, CurrencyPipe, DatePipe],
  template: `
    <section class="page-shell main-stack">
      @if (successMessage()) {
        <div class="alert success">
          <strong class="alert-title">Pedido creado correctamente</strong>
          <span>{{ successMessage() }}</span>
        </div>
      }

      @if (errorMessage()) {
        <div class="alert error">
          <strong class="alert-title">No pudimos cargar este pedido</strong>
          <span>{{ errorMessage() }}</span>
          <a class="button ghost" routerLink="/orders" style="margin-top: 0.75rem;">Volver a mis pedidos</a>
        </div>
      } @else if (isLoading()) {
        <div class="app-card loading-state">
          <span class="eyebrow">Cargando pedido</span>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
        </div>
      } @else if (order()) {
        <div class="hero-card">
          <app-page-header
            eyebrow="Detalle de pedido"
            [title]="order()!.restaurantName"
            [subtitle]="'Pedido ' + order()!.id"
          />
          <div class="hero-actions">
            <span [attr.class]="'badge ' + statusClass(order()!.status)">{{ readableStatus(order()!.status) }}</span>
            <a class="button ghost" routerLink="/orders">Volver a mis pedidos</a>
          </div>
        </div>

        <div class="split">
          <div class="app-card">
            <div class="section-heading">
              <div>
                <h2>Entrega</h2>
                <p class="muted">Datos usados para ubicar y entregar el pedido.</p>
              </div>
            </div>

            <div class="detail-list">
              <div>
                <strong>Direccion</strong>
                <p class="muted">{{ order()!.deliveryAddress }}</p>
              </div>
              <div>
                <strong>Referencia</strong>
                <p class="muted">{{ order()!.deliveryReference || 'Sin referencia' }}</p>
              </div>
              <div>
                <strong>Metodo de pago</strong>
                <p class="muted">{{ order()!.paymentMethod }}</p>
              </div>
              @if (hasText(order()!.notes)) {
                <div>
                  <strong>Notas</strong>
                  <p class="muted">{{ order()!.notes }}</p>
                </div>
              }
            </div>
          </div>

          <div class="app-card">
            <div class="section-heading">
              <div>
                <h2>Totales</h2>
                <p class="muted">Montos confirmados por el backend.</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <span>Subtotal</span>
                <strong>{{ order()!.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
              </div>
              <div class="stat-card">
                <span>Delivery</span>
                <strong>{{ order()!.deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
              </div>
              <div class="stat-card">
                <span>Total</span>
                <strong>{{ order()!.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="app-card">
          <div class="section-heading">
            <div>
              <h2>Seguimiento</h2>
              <p class="muted">Fechas disponibles para entender el avance del pedido.</p>
            </div>
          </div>

          <div class="timeline">
            <div class="timeline-item active">
              <strong>Creado</strong>
              <span class="muted">{{ order()!.createdAtUtc | date: 'medium' }}</span>
            </div>
            @if (order()!.acceptedAtUtc) {
              <div class="timeline-item active">
                <strong>Aceptado</strong>
                <span class="muted">{{ order()!.acceptedAtUtc | date: 'medium' }}</span>
              </div>
            }
            @if (order()!.readyAtUtc) {
              <div class="timeline-item active">
                <strong>Listo</strong>
                <span class="muted">{{ order()!.readyAtUtc | date: 'medium' }}</span>
              </div>
            }
            @if (order()!.pickedUpAtUtc) {
              <div class="timeline-item active">
                <strong>Recogido</strong>
                <span class="muted">{{ order()!.pickedUpAtUtc | date: 'medium' }}</span>
              </div>
            }
            @if (order()!.deliveredAtUtc) {
              <div class="timeline-item active">
                <strong>Entregado</strong>
                <span class="muted">{{ order()!.deliveredAtUtc | date: 'medium' }}</span>
              </div>
            }
          </div>
        </div>

        <div class="app-card">
          <div class="section-heading">
            <div>
              <h2>Productos</h2>
              <p class="muted">Items incluidos en este pedido.</p>
            </div>
          </div>

          @if (!order()!.items.length) {
            <div class="empty-state">
              <div class="empty-state-icon">I</div>
              <h3>No hay items visibles</h3>
              <p class="muted">El pedido no tiene productos asociados para mostrar.</p>
            </div>
          } @else {
            <div class="list">
              @for (item of order()!.items; track item.productName + item.quantity) {
                <div class="cart-line">
                  <div class="item-row">
                    <div>
                      <h3>{{ item.productName }}</h3>
                      <p class="muted">Cantidad: {{ item.quantity }} - Unitario: {{ item.unitPrice | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                    <strong class="price">{{ item.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class MyOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<CustomerOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly hasText = hasText;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const created = this.route.snapshot.queryParamMap.get('created');

    if (created === '1') {
      this.successMessage.set('Tu pedido fue enviado al restaurante. Ahora puedes seguir su estado aqui.');
    }

    if (!id) {
      this.errorMessage.set('No se encontro el pedido solicitado.');
      this.isLoading.set(false);
      return;
    }

    this.ordersApi
      .getMyOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Revisa si el pedido existe o pertenece a tu cuenta.'));
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
