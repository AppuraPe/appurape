import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerOrderListItemResponse } from '../../core/models/orders.models';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { OrderSummaryCardComponent } from './components/order-summary-card.component';

type OrderScope = 'active' | 'history' | 'cancelled';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [
    AppBackButtonComponent,
    OrderSummaryCardComponent,
    MobilePageShellComponent,
    AppButtonComponent,
    UnifiedEmptyStateComponent,
  ],
  templateUrl: './my-orders-page.component.html',
})
export class MyOrdersPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<CustomerOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedScope = signal<OrderScope>('active');

  readonly filteredOrders = computed(() => {
    const scope = this.selectedScope();
    return this.orders().filter((order) => {
      if (scope === 'history') {
        return order.status === 'Delivered';
      }

      if (scope === 'cancelled') {
        return order.status === 'Cancelled';
      }

      return !['Delivered', 'Cancelled'].includes(order.status);
    });
  });
  readonly activeOrders = computed(() =>
    this.orders().filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length,
  );
  readonly deliveredOrders = computed(() => this.orders().filter((order) => order.status === 'Delivered').length);
  readonly cancelledOrders = computed(() => this.orders().filter((order) => order.status === 'Cancelled').length);
  readonly scopeTitle = computed(() => {
    switch (this.selectedScope()) {
      case 'history':
        return 'Pedidos entregados';
      case 'cancelled':
        return 'Pedidos cancelados';
      default:
        return 'Pedidos activos';
    }
  });
  readonly scopeEmptyMessage = computed(() => {
    switch (this.selectedScope()) {
      case 'history':
        return 'Los pedidos entregados aparecerán aquí.';
      case 'cancelled':
        return 'No tienes pedidos cancelados.';
      default:
        return 'Cuando hagas un pedido, podrás seguir su estado aquí.';
    }
  });

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.ordersApi
      .getMyOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          const message = this.ordersErrorMessage(error);
          this.errorMessage.set(message);
          this.notificationService.error(message);
          this.isLoading.set(false);
        },
      });
  }

  selectScope(scope: OrderScope): void {
    this.selectedScope.set(scope);
  }

  private ordersErrorMessage(error: unknown): string {
    const status = (error as { status?: number } | null)?.status;
    switch (status) {
      case 0:
        return 'No pudimos conectarnos. Revisa tu internet e intenta nuevamente.';
      case 401:
        return 'Tu sesión ha vencido. Inicia sesión nuevamente para ver tus pedidos.';
      case 403:
        return 'No tienes permiso para ver estos pedidos. Usa una cuenta de cliente.';
      default:
        return 'No pudimos cargar tus pedidos. Intenta nuevamente.';
    }
  }
}
