import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MyRestaurantResponse, RestaurantOrderListItemResponse } from '../../core/models/restaurant.models';
import { MyRestaurantApiService } from '../../core/services/my-restaurant-api.service';
import { RestaurantOrdersApiService } from '../../core/services/restaurant-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-restaurant-dashboard-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="grid">
      <div class="page-card">
        <app-page-header
          eyebrow="AppuraPe Restaurant"
          title="Panel del restaurante"
          subtitle="Resumen operativo basico con datos reales del restaurante y sus pedidos."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        } @else if (isLoading()) {
          <div class="message">Cargando contexto del restaurante...</div>
        } @else if (restaurant()) {
          @if (restaurant()!.approvalStatus === 'Pending') {
            <app-notice
              tone="warning"
              title="Tu restaurante aun no aparece al publico"
              message="Sigue pendiente de aprobacion. Puedes preparar tu perfil y menu, pero no recibiras pedidos hasta que admin lo apruebe."
            />
          }

          @if (restaurant()!.approvalStatus === 'Rejected' || !restaurant()!.isActive) {
            <app-notice
              tone="danger"
              title="Operacion restringida"
              message="Tu restaurante no esta activo para recibir pedidos. Revisa el estado de aprobacion o contacta al administrador."
            />
          }

          <div class="stats-grid">
            <div class="stat-card">
              <span class="muted">Restaurante</span>
              <strong>{{ restaurant()!.name }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Zona</span>
              <strong>{{ restaurant()!.zoneName }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Pedidos totales</span>
              <strong>{{ ordersCount() }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Pendientes o activos</span>
              <strong>{{ activeOrdersCount() }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Aprobacion</span>
              <strong><app-status-badge [status]="restaurant()!.approvalStatus" /></strong>
            </div>
          </div>
        }

        <div class="page-actions">
          <a class="button" routerLink="/restaurant/orders">Pedidos</a>
          <a class="button secondary" routerLink="/restaurant/profile">Perfil</a>
          <a class="button secondary" routerLink="/restaurant/menu/categories">Categorias</a>
          <a class="button ghost" routerLink="/restaurant/menu/items">Productos</a>
        </div>
      </div>
    </section>
  `,
})
export class RestaurantDashboardPageComponent {
  private readonly myRestaurantApi = inject(MyRestaurantApiService);
  private readonly restaurantOrdersApi = inject(RestaurantOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restaurant = signal<MyRestaurantResponse | null>(null);
  readonly ordersCount = signal(0);
  readonly activeOrdersCount = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      restaurant: this.myRestaurantApi.getMyRestaurant(),
      orders: this.restaurantOrdersApi.getOrders(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ restaurant, orders }) => {
          this.restaurant.set(restaurant);
          this.ordersCount.set(orders.length);
          this.activeOrdersCount.set(this.countActiveOrders(orders));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el dashboard del restaurante.'));
          this.isLoading.set(false);
        },
      });
  }

  private countActiveOrders(orders: RestaurantOrderListItemResponse[]): number {
    return orders.filter((order) =>
      ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'OnTheWay'].includes(order.status),
    ).length;
  }
}
