import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Clock3, LucideAngularModule, MapPin, PackageCheck, RefreshCw, Truck, Wallet } from 'lucide-angular';
import { DriverOrderDetailResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-driver-active-order-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    StatusBadgeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(88px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4 lg:gap-6'">
      <app-surface-card variant="page" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="Driver"
          title="Pedido activo"
          subtitle="Aquí ves la entrega que está bajo tu responsabilidad en este momento."
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }
      </app-surface-card>

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando pedido activo" />
          <app-unified-loading-state label="Actualizando seguimiento" />
        </div>
      } @else if (errorMessage()) {
        <app-unified-empty-state title="No pudimos cargar el pedido activo" message="Intenta nuevamente para revisar la entrega actual.">
          <app-button type="button" variant="secondary" (click)="loadActiveOrder()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!activeOrder()) {
        <app-unified-empty-state title="Sin pedido activo" message="Todavía no tienes una entrega activa. Puedes revisar los pedidos disponibles para tomar uno.">
          <app-button [routerLink]="'/driver/orders'">Ver pedidos disponibles</app-button>
        </app-unified-empty-state>
      } @else if (activeOrder(); as order) {
        <app-surface-card variant="page" extraClass="p-5">
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
            <div class="grid gap-4">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="truckIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="grid gap-1 min-w-0">
                  <strong class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">{{ order.restaurantName }}</strong>
                  <span class="text-sm text-slate-500">{{ order.deliveryAddress }}</span>
                  <span class="text-sm text-slate-500">Pedido {{ shortOrderId(order.id) }}</span>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapIcon" aria-hidden="true"></lucide-angular>
                    Recojo
                  </div>
                  <p class="mt-2 text-sm font-semibold text-slate-950">{{ order.restaurantAddress }}</p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                    Estado
                  </div>
                  <div class="mt-2">
                    <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-4">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                    Total
                  </div>
                  <p class="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="packageIcon" aria-hidden="true"></lucide-angular>
                    Pago
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ paymentMethodLabel(order.paymentMethod) }}</p>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <app-button [routerLink]="['/driver/orders', order.id]">Ver detalle</app-button>
                <app-button type="button" variant="secondary" (click)="loadActiveOrder()">
                  <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                  Recargar
                </app-button>
              </div>
            </div>
          </div>
        </app-surface-card>
      }
    </app-mobile-page-shell>
  `,
})
export class DriverActiveOrderPageComponent {
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly truckIcon = Truck;
  readonly mapIcon = MapPin;
  readonly walletIcon = Wallet;
  readonly packageIcon = PackageCheck;
  readonly clockIcon = Clock3;
  readonly refreshIcon = RefreshCw;

  readonly activeOrder = signal<DriverOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadActiveOrder();
  }

  loadActiveOrder(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.driverOrdersApi
      .getActiveOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.activeOrder.set(order);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el pedido activo.'));
          this.isLoading.set(false);
        },
      });
  }

  shortOrderId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  readableOrderStatus(status: string): string {
    switch (status) {
      case 'Assigned':
        return 'Repartidor asignado';
      case 'PickedUp':
        return 'Recogido';
      case 'OnTheWay':
        return 'En camino';
      case 'Delivered':
        return 'Entregado';
      case 'Cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[method] ?? method;
  }
}
