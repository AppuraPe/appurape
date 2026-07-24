import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CreditCard, LucideAngularModule, MapPin, Package, Phone, Store, Truck, UserRound } from 'lucide-angular';
import { DriverOrderDetailResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

interface DriverAction {
  label: string;
  type: 'accept' | 'picked-up' | 'on-the-way' | 'delivered';
}

@Component({
  selector: 'app-driver-order-detail-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideAngularModule,
    AppBackButtonComponent,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    StatusBadgeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    BottomSafeActionBarComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(108px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4 lg:gap-6'">
      <div class="flex flex-wrap gap-3">
        <app-back-button fallbackUrl="/driver/orders" label="Volver a pedidos" />
      </div>

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando detalle de la entrega" />
          <app-unified-loading-state label="Preparando estado" />
        </div>
      } @else if (errorMessage() && !order()) {
        <app-unified-empty-state title="No encontramos la entrega" message="Intenta nuevamente para revisar este pedido.">
          <app-button type="button" variant="secondary" (click)="loadOrder()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (order(); as order) {
        <app-surface-card variant="page" extraClass="p-5">
          <app-internal-page-section-header
            eyebrow="Driver"
            title="Detalle de entrega"
            subtitle="Revisa recojo, entrega, pago y el siguiente paso operativo antes de avanzar el pedido."
            [meta]="'#' + shortOrderId(order.id)"
          />

          @if (errorMessage()) {
            <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
          }

          <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <app-surface-card variant="soft" extraClass="grid gap-4 p-4">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="truckIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="grid gap-1">
                  <strong class="text-xl font-extrabold tracking-[-0.03em] text-slate-950">Pedido {{ shortOrderId(order.id) }}</strong>
                  <span class="text-sm text-slate-500">{{ order.createdAtUtc | date: 'medium' }}</span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <app-status-badge [status]="order.status" />
                <app-status-badge [status]="order.paymentStatus" [label]="paymentStatusLabel(order.paymentStatus)" prefix="Pago" />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                    Recojo
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ order.restaurantName }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ order.restaurantAddress }}</p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapIcon" aria-hidden="true"></lucide-angular>
                    Entrega
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ order.deliveryAddress }}</p>
                  @if (order.deliveryReference) {
                    <p class="mt-1 text-sm text-slate-500">{{ order.deliveryReference }}</p>
                  }
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="userIcon" aria-hidden="true"></lucide-angular>
                    Cliente
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ order.customerName }}</p>
                  @if (order.customerPhone) {
                    <p class="mt-1 inline-flex min-h-11 items-center gap-2 text-sm text-slate-500">
                      <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                      {{ order.customerPhone }}
                    </p>
                  }
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="creditCardIcon" aria-hidden="true"></lucide-angular>
                    Pago
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ paymentMethodLabel(order.paymentMethod) }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ paymentStatusLabel(order.paymentStatus) }}</p>
                </div>
              </div>

              @if (order.notes) {
                <app-notice tone="info" title="Notas del cliente" [message]="order.notes" />
              }
            </app-surface-card>

            <app-surface-card variant="page" extraClass="grid gap-4 p-4">
              <div class="flex items-center gap-2">
                <lucide-angular class="h-5 w-5 text-primary-700" [img]="packageIcon" aria-hidden="true"></lucide-angular>
                <h2 class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Productos del pedido</h2>
              </div>

              <div class="grid gap-3">
                @for (item of order.items; track item.productName + '-' + item.unitPrice) {
                  <div class="grid gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-950">{{ item.productName }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ item.quantity }} x {{ item.unitPrice | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                    <strong class="text-sm text-slate-950">{{ item.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                }
              </div>

              <div class="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-500">Subtotal</span>
                  <strong class="text-slate-950">{{ order.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-500">Delivery</span>
                  <strong class="text-slate-950">{{ order.deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                  <span class="font-bold text-slate-950">Total</span>
                  <strong class="text-base font-black text-slate-950">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                </div>
              </div>
            </app-surface-card>
          </div>
        </app-surface-card>

        @if (availableActions().length) {
          <app-bottom-safe-action-bar mode="fixed">
            <div class="flex flex-wrap gap-3">
              @for (action of availableActions(); track action.type) {
                <app-button type="button" size="md" [disabled]="isSubmitting()" (click)="runAction(action)">
                  {{ isSubmitting() ? 'Procesando...' : action.label }}
                </app-button>
              }
            </div>
          </app-bottom-safe-action-bar>
        } @else {
          <app-notice tone="info" title="Sin acción pendiente" message="Este pedido no tiene un siguiente paso disponible para el driver." />
        }
      }
    </app-mobile-page-shell>
  `,
})
export class DriverOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly truckIcon = Truck;
  readonly storeIcon = Store;
  readonly mapIcon = MapPin;
  readonly userIcon = UserRound;
  readonly phoneIcon = Phone;
  readonly creditCardIcon = CreditCard;
  readonly packageIcon = Package;

  readonly order = signal<DriverOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly availableActions = computed(() => this.getActions(this.order()?.status ?? ''));

  private readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';

  constructor() {
    this.loadOrder();
  }

  loadOrder(): void {
    if (!this.orderId) {
      this.errorMessage.set('No encontramos la entrega solicitada.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.driverOrdersApi
      .getOrderById(this.orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el detalle de la entrega.'));
          this.isLoading.set(false);
        },
      });
  }

  runAction(action: DriverAction): void {
    const currentOrder = this.order();

    if (!currentOrder) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const request$ =
      action.type === 'accept'
        ? this.driverOrdersApi.acceptOrder(currentOrder.id)
        : action.type === 'picked-up'
          ? this.driverOrdersApi.markPickedUp(currentOrder.id)
          : action.type === 'on-the-way'
            ? this.driverOrdersApi.markOnTheWay(currentOrder.id)
            : this.driverOrdersApi.markDelivered(currentOrder.id);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (order) => {
        this.order.set(order);
        this.isSubmitting.set(false);
        this.notificationService.success(this.successMessage(action.type));
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la entrega. Intenta nuevamente.'));

        const message = String(error?.error?.message ?? '');
        if (error?.status === 403) {
          this.notificationService.error('No tienes permisos para gestionar esta entrega.');
          return;
        }

        if (message.includes('ya fue tomado por otro repartidor')) {
          this.notificationService.warning('Este pedido ya fue tomado por otro repartidor.');
          return;
        }

        this.notificationService.error('No se pudo actualizar la entrega. Intenta nuevamente.');
      },
    });
  }

  shortOrderId(id: string): string {
    return id.slice(0, 8).toUpperCase();
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

  paymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      PendingConfirmation: 'Pendiente de confirmación',
      Paid: 'Pagado',
      Rejected: 'Rechazado',
      Failed: 'Fallido',
      Refunded: 'Reembolsado',
    };

    return labels[status] ?? status;
  }

  private getActions(status: string): DriverAction[] {
    switch (status) {
      case 'ReadyForPickup':
        return [{ label: 'Aceptar entrega', type: 'accept' }];
      case 'Assigned':
        return [{ label: 'Marcar como recogido', type: 'picked-up' }];
      case 'PickedUp':
        return [{ label: 'Marcar en camino', type: 'on-the-way' }];
      case 'OnTheWay':
        return [{ label: 'Marcar entregado', type: 'delivered' }];
      default:
        return [];
    }
  }

  private successMessage(type: DriverAction['type']): string {
    switch (type) {
      case 'accept':
        return 'Entrega aceptada.';
      case 'picked-up':
        return 'Pedido recogido.';
      case 'on-the-way':
        return 'Pedido en camino.';
      case 'delivered':
        return 'Pedido entregado correctamente.';
    }
  }
}
