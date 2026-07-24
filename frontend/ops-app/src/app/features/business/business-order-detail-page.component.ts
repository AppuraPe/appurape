import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  BadgeCheck,
  CircleSlash,
  CookingPot,
  CreditCard,
  LucideAngularModule,
  Package,
  Phone,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-angular';
import { BusinessOrderDetailResponse, BusinessOrderStatus } from '../../core/models/business.model';
import { BusinessOrdersApiService } from '../../core/services/business-orders-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { toOrderStatusValue } from '../../core/utils/order-status.utils';
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

interface BusinessOrderAction {
  label: string;
  status: BusinessOrderStatus | 'Cancelled';
  variant?: 'danger';
}

@Component({
  selector: 'app-business-order-detail-page',
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
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(108px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4'">
      <div class="flex flex-wrap items-center gap-3">
        <app-back-button fallbackUrl="/business/orders" label="Volver a pedidos" />
      </div>

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando detalle" />
          <app-unified-loading-state label="Preparando operación" />
        </div>
      } @else if (errorMessage() && !order()) {
        <app-unified-empty-state title="Pedido no disponible" message="No se pudo cargar el detalle del pedido.">
          <app-button type="button" variant="secondary" (click)="loadOrder()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (order(); as order) {
        <app-surface-card variant="page" extraClass="p-5">
          <app-internal-page-section-header
            eyebrow="Negocio"
            title="Detalle del pedido"
            subtitle="Revisa productos, pago y el siguiente paso operativo antes de mover el estado."
            [meta]="'#' + shortId(order.id)"
          />

          @if (errorMessage()) {
            <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
          }

          <div class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <app-surface-card variant="soft" extraClass="grid gap-4 p-4">
              <div class="flex items-start gap-3">
                <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-5 w-5" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="min-w-0">
                  <h2 class="text-xl font-extrabold tracking-[-0.03em] text-slate-950">Pedido {{ shortId(order.id) }}</h2>
                  <p class="text-sm text-slate-500">{{ order.createdAtUtc | date: 'medium' }}</p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Cliente</p>
                  <p class="mt-2 text-base font-bold text-slate-950">{{ order.customerName }}</p>
                  @if (order.customerPhone) {
                    <div class="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-slate-500">
                      <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                      {{ order.customerPhone }}
                    </div>
                  }
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Entrega</p>
                  <div class="mt-2 grid gap-1 text-sm text-slate-900">
                    <p class="font-semibold">{{ order.deliveryAddress }}</p>
                    <p class="text-slate-500">{{ order.deliveryReference }}</p>
                  </div>
                </div>
              </div>

              @if (order.notes) {
                <app-notice tone="info" title="Notas del cliente" [message]="order.notes" />
              }
            </app-surface-card>

            <app-surface-card variant="soft" extraClass="grid gap-4 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <app-status-badge [status]="order.status" />
                <app-status-badge [status]="order.paymentStatus" [label]="paymentStatusLabel(order.paymentStatus)" prefix="Pago" />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                    Total
                  </div>
                  <p class="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="creditCardIcon" aria-hidden="true"></lucide-angular>
                    Método de pago
                  </div>
                  <p class="mt-2 text-base font-bold text-slate-950">{{ paymentMethodLabel(order.paymentMethod) }}</p>
                  @if (isManualPayment(order.paymentMethod)) {
                    <p class="mt-1 text-xs text-slate-500">Pago manual del negocio.</p>
                  } @else {
                    <p class="mt-1 text-xs text-slate-500">Pago contra entrega.</p>
                  }
                </div>
              </div>

              @if (showManualPaymentNotice(order)) {
                <app-notice
                  tone="warning"
                  title="Pago pendiente de confirmación"
                  message="El pago aún está pendiente de confirmación."
                />
              } @else if (order.status === 'ReadyForPickup') {
                <app-notice
                  tone="info"
                  title="Pedido listo"
                  message="Pedido listo para recojo o asignación de delivery."
                />
              }
            </app-surface-card>
          </div>
        </app-surface-card>

        <app-surface-card variant="page" extraClass="grid gap-4 p-4">
          <div class="flex items-center gap-2">
            <lucide-angular class="h-5 w-5 text-primary-700" [img]="packageIcon" aria-hidden="true"></lucide-angular>
            <h3 class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Productos del pedido</h3>
          </div>

          <div class="grid gap-3">
            @for (item of order.items; track item.productName + '-' + item.unitPrice) {
              <div class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                <div class="overflow-hidden rounded-2xl bg-slate-100">
                  @if (item.imageUrl) {
                    <img class="h-[72px] w-full object-cover object-center" [src]="item.imageUrl" [alt]="item.productName" />
                  } @else {
                    <div class="grid h-[72px] w-full place-items-center bg-slate-100 text-slate-500">
                      <lucide-angular class="h-5 w-5" [img]="packageIcon" aria-hidden="true"></lucide-angular>
                    </div>
                  }
                </div>

                <div class="min-w-0">
                  <p class="text-sm font-bold text-slate-950">{{ item.productName }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.quantity }} × {{ item.unitPrice | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                </div>

                <p class="text-sm font-black text-slate-950">{{ item.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
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

        @if (availableActions().length) {
          <app-bottom-safe-action-bar mode="fixed">
            <div class="flex flex-wrap gap-3">
              @for (action of availableActions(); track action.label) {
                <app-button
                  [variant]="action.variant === 'danger' ? 'danger' : 'primary'"
                  size="md"
                  type="button"
                  [disabled]="isSubmitting()"
                  (click)="handleAction(action)"
                >
                  @if (action.variant === 'danger') {
                    <lucide-angular class="h-4 w-4" [img]="cancelIcon" aria-hidden="true"></lucide-angular>
                  } @else if (action.status === 'Preparing') {
                    <lucide-angular class="h-4 w-4" [img]="cookingIcon" aria-hidden="true"></lucide-angular>
                  } @else if (action.status === 'ReadyForPickup') {
                    <lucide-angular class="h-4 w-4" [img]="readyIcon" aria-hidden="true"></lucide-angular>
                  } @else {
                    <lucide-angular class="h-4 w-4" [img]="acceptIcon" aria-hidden="true"></lucide-angular>
                  }
                  {{ isSubmitting() ? 'Procesando...' : action.label }}
                </app-button>
              }
            </div>
          </app-bottom-safe-action-bar>
        } @else {
          <app-notice
            tone="info"
            title="Sin acciones disponibles"
            message="Este pedido ya no tiene acciones operativas disponibles para el negocio."
          />
        }
      }

      @if (rejectConfirmationOpen()) {
        <div class="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" (click)="closeRejectConfirmation()"></div>
        <div class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-3 pb-3 sm:inset-0 sm:grid sm:place-items-center sm:px-6 sm:py-8">
          <section
            class="w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(6,25,43,0.24)]"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">¿Seguro que deseas rechazar este pedido?</h2>
            <p class="mt-2 text-sm text-slate-500">El pedido pasará a cancelado y ya no seguirá el flujo operativo del negocio.</p>

            <div class="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <app-button type="button" variant="ghost" size="md" (click)="closeRejectConfirmation()" [disabled]="isSubmitting()">
                Cancelar
              </app-button>
              <app-button type="button" variant="danger" size="md" (click)="confirmReject()" [disabled]="isSubmitting()">
                {{ isSubmitting() ? 'Procesando...' : 'Rechazar pedido' }}
              </app-button>
            </div>
          </section>
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class BusinessOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly businessOrdersApi = inject(BusinessOrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly receiptIcon = ReceiptText;
  readonly phoneIcon = Phone;
  readonly walletIcon = Wallet;
  readonly creditCardIcon = CreditCard;
  readonly packageIcon = Package;
  readonly cookingIcon = CookingPot;
  readonly acceptIcon = ShieldCheck;
  readonly readyIcon = BadgeCheck;
  readonly cancelIcon = CircleSlash;

  readonly order = signal<BusinessOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly rejectConfirmationOpen = signal(false);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly availableActions = computed(() => this.getActions(this.order()?.status ?? ''));

  constructor() {
    this.loadOrder();
  }

  loadOrder(): void {
    if (!this.orderId) {
      this.errorMessage.set('No encontramos el pedido solicitado.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.businessOrdersApi
      .getOrderById(this.orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el detalle del pedido.'));
          this.isLoading.set(false);
        },
      });
  }

  shortId(id: string): string {
    return id.slice(0, 8);
  }

  paymentMethodLabel(method: string): string {
    switch (method.trim().toLowerCase()) {
      case 'cash':
        return 'Efectivo';
      case 'yape':
        return 'Yape';
      case 'plin':
        return 'Plin';
      case 'card':
        return 'Tarjeta';
      default:
        return method;
    }
  }

  paymentStatusLabel(status: string): string {
    switch (status) {
      case 'PendingConfirmation':
        return 'Pendiente de confirmación';
      case 'Paid':
        return 'Pagado';
      case 'Rejected':
        return 'Rechazado';
      case 'Pending':
        return 'Pendiente';
      case 'Failed':
        return 'Fallido';
      case 'Refunded':
        return 'Reembolsado';
      default:
        return status || 'Sin estado';
    }
  }

  paymentBadgeClass(status: string): string {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'Rejected':
      case 'Failed':
        return 'bg-red-100 text-red-700';
      case 'PendingConfirmation':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  isManualPayment(method: string): boolean {
    return ['yape', 'plin'].includes(method.trim().toLowerCase());
  }

  showManualPaymentNotice(order: BusinessOrderDetailResponse): boolean {
    return this.isManualPayment(order.paymentMethod) && order.paymentStatus === 'PendingConfirmation';
  }

  handleAction(action: BusinessOrderAction): void {
    if (action.status === 'Cancelled') {
      this.rejectConfirmationOpen.set(true);
      return;
    }

    this.runStatusUpdate(action.status);
  }

  closeRejectConfirmation(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.rejectConfirmationOpen.set(false);
  }

  confirmReject(): void {
    this.runStatusUpdate('Cancelled');
  }

  private runStatusUpdate(status: BusinessOrderStatus | 'Cancelled'): void {
    const currentOrder = this.order();

    if (!currentOrder) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.businessOrdersApi
      .updateOrderStatus(currentOrder.id, { status: toOrderStatusValue(status) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.order.set(response);
          this.isSubmitting.set(false);
          this.rejectConfirmationOpen.set(false);
          this.notificationService.success(this.successMessageForStatus(status));
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.rejectConfirmationOpen.set(false);
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el pedido. Intenta nuevamente.'));

          if (error?.status === 403) {
            this.notificationService.warning('No tienes permisos para gestionar este pedido.');
            return;
          }

          this.notificationService.error('No se pudo actualizar el pedido. Intenta nuevamente.');
        },
      });
  }

  private getActions(status: string): BusinessOrderAction[] {
    switch (status) {
      case 'Pending':
        return [
          { label: 'Aceptar pedido', status: 'Accepted' },
          { label: 'Rechazar pedido', status: 'Cancelled', variant: 'danger' },
        ];
      case 'Accepted':
        return [{ label: 'Marcar en preparación', status: 'Preparing' }];
      case 'Preparing':
        return [{ label: 'Marcar como listo', status: 'ReadyForPickup' }];
      default:
        return [];
    }
  }

  private successMessageForStatus(status: BusinessOrderStatus | 'Cancelled'): string {
    switch (status) {
      case 'Accepted':
        return 'Pedido aceptado.';
      case 'Preparing':
        return 'Pedido marcado en preparación.';
      case 'ReadyForPickup':
        return 'Pedido marcado como listo.';
      case 'Cancelled':
        return 'Pedido rechazado.';
      default:
        return 'Pedido actualizado.';
    }
  }
}
