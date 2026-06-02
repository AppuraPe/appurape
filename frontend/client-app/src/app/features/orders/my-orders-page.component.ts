import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { CustomerOrderListItemResponse } from '../../core/models/orders.models';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { OrderSummaryCardComponent } from './components/order-summary-card.component';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, OrderSummaryCardComponent],
  templateUrl: './my-orders-page.component.html',
})
export class MyOrdersPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly notificationService = inject(NotificationService);
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
  readonly totalOrders = computed(() => this.orders().length);
  readonly activeOrders = computed(() =>
    this.orders().filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length,
  );
  readonly deliveredOrders = computed(() => this.orders().filter((order) => order.status === 'Delivered').length);

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
          const message = getApiErrorMessage(error, 'Revisa tu sesion o intenta nuevamente.');
          this.errorMessage.set(message);
          this.notificationService.error(message);
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

  private statusOrder(): string[] {
    return ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'Delivered', 'Cancelled'];
  }

  private normalizeSearchTerm(value: string): string {
    return value.trim().toLocaleLowerCase();
  }
}
