import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, Phone, RefreshCw, Store } from 'lucide-angular';
import { DriverOrderDetailResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';

@Component({
  selector: 'app-driver-active-order-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    BottomSafeActionBarComponent,
    StatusBadgeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(104px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-3.5 overflow-x-hidden lg:gap-4'">
      <header class="grid gap-3 px-0.5">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <app-internal-page-section-header
            eyebrow="Repartidor"
            title="Entrega activa"
            subtitle="Consulta el siguiente paso y continúa tu ruta."
          />
          <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-primary-700 shadow-sm active:scale-95" (click)="loadActiveOrder()" [disabled]="isLoading()" aria-label="Actualizar entrega">
            <lucide-angular class="h-4 w-4" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
          </button>
        </div>

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }
      </header>

      @if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando entrega activa" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-[86px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5">
              <div class="flex h-full items-center gap-3">
                <div class="h-10 w-10 shrink-0 rounded-xl bg-slate-200"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="h-2.5 w-1/2 rounded-full bg-slate-100"></div>
                </div>
              </div>
            </div>
          }
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
        <app-surface-card variant="default" extraClass="grid w-full min-w-0 max-w-full gap-3.5 p-4">
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div class="min-w-0">
              <strong class="block truncate text-base font-extrabold tracking-[-0.02em] text-slate-950" [title]="order.restaurantName">{{ order.restaurantName }}</strong>
              <p class="mt-1 text-xs text-slate-500">Pedido {{ shortOrderId(order.id) }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.06em] text-emerald-700">Tu ganancia</p>
              <p class="mt-0.5 whitespace-nowrap text-xl font-black tabular-nums text-emerald-700">{{ order.courierEarningAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            </div>
          </div>

          <div class="flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{{ paymentMethodLabel(order.paymentMethod) }}</span>
          </div>

          <div class="grid grid-cols-3 gap-1.5" aria-label="Progreso de entrega">
            @for (step of deliverySteps; track step.status) {
              <div class="min-w-0 rounded-xl px-2 py-2 text-center" [class]="isStepComplete(order.status, step.status) ? 'bg-primary-50 text-primary-700' : 'bg-slate-50 text-slate-400'">
                <span class="mx-auto grid h-5 w-5 place-items-center rounded-full text-[10px] font-black" [class]="isStepComplete(order.status, step.status) ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-500'">{{ step.index }}</span>
                <p class="mt-1 truncate text-[10px] font-bold">{{ step.label }}</p>
              </div>
            }
          </div>

          <div class="rounded-xl bg-primary-50 px-3 py-2.5">
            <p class="text-[10px] font-black uppercase tracking-[0.08em] text-primary-700">Siguiente paso</p>
            <p class="mt-1 text-sm font-bold text-slate-950">{{ nextStepLabel(order.status) }}</p>
          </div>
        </app-surface-card>

        <div class="grid gap-3 md:grid-cols-2">
          <app-surface-card variant="default" extraClass="grid min-w-0 gap-2.5 p-3.5">
            <div class="flex min-w-0 items-center gap-2">
              <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="storeIcon" aria-hidden="true"></lucide-angular>
              <p class="text-xs font-black uppercase tracking-[0.06em] text-slate-500">Recoger en</p>
            </div>
            <p class="truncate text-sm font-bold text-slate-950" [title]="order.restaurantName">{{ order.restaurantName }}</p>
            <p class="break-words text-xs leading-5 text-slate-600">{{ order.restaurantAddress }}</p>
          </app-surface-card>

          <app-surface-card variant="default" extraClass="grid min-w-0 gap-2.5 p-3.5">
            <div class="flex min-w-0 items-center gap-2">
              <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="mapIcon" aria-hidden="true"></lucide-angular>
              <p class="text-xs font-black uppercase tracking-[0.06em] text-slate-500">Entregar a</p>
            </div>
            <p class="truncate text-sm font-bold text-slate-950" [title]="order.customerName">{{ order.customerName }}</p>
            <p class="break-words text-xs leading-5 text-slate-600">{{ order.deliveryAddress }}</p>
            @if (order.deliveryReference) {
              <p class="break-words text-xs leading-5 text-slate-500">Referencia: {{ order.deliveryReference }}</p>
            }
            @if (order.customerPhone) {
              <a class="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-primary-700 no-underline" [href]="'tel:' + order.customerPhone">
                <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                Llamar al cliente
              </a>
            }
          </app-surface-card>
        </div>

        <app-bottom-safe-action-bar mode="fixed">
          <app-button size="md" [routerLink]="['/driver/orders', order.id]" block>
            Continuar entrega
          </app-button>
        </app-bottom-safe-action-bar>
      }
    </app-mobile-page-shell>
  `,
})
export class DriverActiveOrderPageComponent {
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly mapIcon = MapPin;
  readonly storeIcon = Store;
  readonly phoneIcon = Phone;
  readonly refreshIcon = RefreshCw;
  readonly deliverySteps = [
    { index: 1, label: 'Recogido', status: 'PickedUp' },
    { index: 2, label: 'En camino', status: 'OnTheWay' },
    { index: 3, label: 'Entregado', status: 'Delivered' },
  ] as const;

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
        return 'En proceso';
    }
  }

  isStepComplete(currentStatus: string, stepStatus: string): boolean {
    const order = ['Assigned', 'ReadyForPickup', 'PickedUp', 'OnTheWay', 'Delivered'];
    return order.indexOf(currentStatus) >= order.indexOf(stepStatus);
  }

  nextStepLabel(status: string): string {
    switch (status) {
      case 'Assigned':
      case 'ReadyForPickup':
        return 'Ve al negocio y confirma el recojo.';
      case 'PickedUp':
        return 'Inicia la ruta hacia el cliente.';
      case 'OnTheWay':
        return 'Entrega el pedido al cliente.';
      case 'Delivered':
        return 'Entrega completada.';
      default:
        return 'Revisa el detalle para continuar.';
    }
  }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[method] ?? 'Método registrado';
  }
}
