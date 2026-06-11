import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  Bike,
  FilterX,
  LucideAngularModule,
  MapPin,
  ReceiptText,
  Search,
  Wallet,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { AvailableDriverOrderListItemResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-driver-available-orders-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    AppNoticeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Driver"
          title="Pedidos disponibles"
          subtitle="Lista real de pedidos listos para tomar dentro de tu flujo operativo."
        />

        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {{ successMessage() }}
          </div>
        }

        <div class="stats-grid">
          <app-metric-card label="Disponibles" [value]="orders().length" helper="Pedidos listos para asignacion" />
          <app-metric-card label="Filtrados" [value]="filtersForm.controls.q.value ? 'Si' : 'No'" helper="Busqueda activa en esta lista" />
          <app-metric-card label="Accion" [value]="actionOrderId() ? 'En proceso' : 'Libre'" helper="Toma de pedido actual" />
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]">
        <form class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Buscar pedido</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="availableOrderSearch"
                type="search"
                formControlName="q"
                placeholder="Negocio, direcci?n o zona"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
              />
            </div>
          </label>

          <div class="flex flex-wrap items-end gap-3 xl:justify-end">
            <app-button type="submit" [disabled]="isLoading() || !!actionOrderId()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button variant="ghost" type="button" [disabled]="isLoading() || !!actionOrderId()" (click)="clearFilters()">
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
        </form>
      </app-surface-card>

      <app-notice
        tone="info"
        title="Antes de tomar un pedido"
        message="El sistema solo permite tomar pedidos si tu cuenta esta aprobada, estas en la zona del pedido y no tienes otro pedido activo."
      />

      @if (isLoading()) {
        <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-text-muted">
          Cargando pedidos disponibles...
        </div>
      } @else if (!orders().length) {
        <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-4 text-sm font-semibold text-text-muted">
          No hay pedidos listos para tomar en este momento.
        </div>
      } @else {
        <div class="grid gap-4">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="page">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ order.restaurantName }}</strong>
                      <span class="text-sm text-text-muted">{{ order.deliveryAddress }}</span>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    @if (order.deliveryReference) {
                      <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                        <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                          <lucide-angular class="h-4 w-4" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                          Referencia
                        </div>
                        <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ order.deliveryReference }}</p>
                      </div>
                    }

                    <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                        Zona
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ order.zoneName }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                        Total
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                        Pago
                      </div>
                      <p class="mt-2 text-sm font-bold text-loreto-carbon">{{ order.paymentMethod }}</p>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm text-text-muted">
                    {{ order.createdAtUtc | date: 'medium' }}
                  </div>

                  <app-button size="lg" type="button" [disabled]="actionOrderId() === order.id" (click)="takeOrder(order)" block>
                    {{ actionOrderId() === order.id ? 'Procesando...' : 'Tomar pedido' }}
                  </app-button>
                </div>
              </div>
            </app-surface-card>
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

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly bikeIcon = Bike;
  readonly mapPinIcon = MapPin;
  readonly receiptIcon = ReceiptText;
  readonly walletIcon = Wallet;

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
