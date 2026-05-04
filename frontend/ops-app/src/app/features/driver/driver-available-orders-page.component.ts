import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { AvailableDriverOrderListItemResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-driver-available-orders-page',
  standalone: true,
  imports: [PageHeaderComponent, CurrencyPipe, DatePipe, ReactiveFormsModule, AppNoticeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Driver"
        title="Pedidos disponibles"
        subtitle="Lista real de pedidos listos para tomar."
      />

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="message success">{{ successMessage() }}</div>
      }

      <form class="filters-grid" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
        <div class="field search-field">
          <label for="availableOrderSearch">Buscar pedido</label>
          <input
            id="availableOrderSearch"
            type="search"
            formControlName="q"
            placeholder="Restaurante, direccion o zona"
            autocomplete="off"
          />
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
        title="Antes de tomar un pedido"
        message="El sistema solo permite tomar pedidos si tu cuenta esta aprobada, estas en la zona del pedido y no tienes otro pedido activo."
      />

      @if (isLoading()) {
        <div class="message">Cargando pedidos disponibles...</div>
      } @else if (!orders().length) {
        <div class="message">No hay pedidos listos para tomar en este momento.</div>
      } @else {
        <div class="list">
          @for (order of orders(); track order.id) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ order.restaurantName }}</strong>
                  <span class="muted">{{ order.deliveryAddress }}</span>
                  @if (order.deliveryReference) {
                    <span class="muted">Referencia: {{ order.deliveryReference }}</span>
                  }
                  <span class="muted">Zona: {{ order.zoneName }}</span>
                </div>

                <div class="stack align-end">
                  <strong>{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  <span class="muted">{{ order.createdAtUtc | date: 'medium' }}</span>
                  <span class="muted">Pago: {{ order.paymentMethod }}</span>
                </div>
              </div>

              <div class="inline-actions">
                <button
                  class="button primary-action"
                  type="button"
                  (click)="takeOrder(order)"
                  [disabled]="actionOrderId() === order.id"
                >
                  {{ actionOrderId() === order.id ? 'Procesando...' : 'Tomar pedido' }}
                </button>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class DriverAvailableOrdersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<AvailableDriverOrderListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly actionOrderId = signal<string | null>(null);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
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
      .getAvailableOrders({ q: filters.q })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los pedidos disponibles.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
      },
      { emitEvent: false },
    );
    this.loadOrders();
  }

  takeOrder(order: AvailableDriverOrderListItemResponse): void {
    this.actionOrderId.set(order.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.driverOrdersApi
      .takeOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Pedido ${order.id.slice(0, 8)} tomado correctamente.`);
          this.actionOrderId.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo tomar el pedido ${order.id.slice(0, 8)}.`));
          this.actionOrderId.set(null);
        },
      });
  }
}
