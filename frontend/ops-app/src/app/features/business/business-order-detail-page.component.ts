import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  BadgeCheck,
  CircleSlash,
  CookingPot,
  LucideAngularModule,
  Navigation,
  Package,
  Phone,
  ShieldCheck,
} from 'lucide-angular';
import { BusinessOrderDetailResponse, BusinessOrderStatus } from '../../core/models/business.model';
import { RefundResponse } from '../../core/models/orders.models';
import { BusinessOrdersApiService } from '../../core/services/business-orders-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { buildGoogleMapsUrl } from '../../core/utils/maps.utils';
import { toOrderStatusValue } from '../../core/utils/order-status.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';

interface BusinessOrderAction {
  label: string;
  status?: BusinessOrderStatus | 'Cancelled';
  kind?: 'dispatch';
  variant?: 'danger';
}

@Component({
  selector: 'app-business-order-detail-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
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
    UnifiedEmptyStateComponent,
    BottomSafeActionBarComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(108px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-full gap-4 overflow-x-hidden'">
      <div class="flex flex-wrap items-center gap-3">
        <app-back-button fallbackUrl="/business/orders" label="Volver a pedidos" />
      </div>

      @if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando detalle del pedido" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-[84px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5">
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
      } @else if (errorMessage() && !order()) {
        <app-unified-empty-state title="Pedido no disponible" message="No se pudo cargar el detalle del pedido.">
          <app-button type="button" variant="secondary" (click)="loadOrder()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (order(); as order) {
        <section class="grid w-full min-w-0 max-w-full gap-3.5 px-0.5">

          @if (errorMessage()) {
            <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
          }

          <div class="grid gap-3 lg:grid-cols-2">
            <app-surface-card variant="default" extraClass="grid min-w-0 gap-3.5 p-4">
              <div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-extrabold tracking-[-0.02em] text-slate-950">Pedido {{ shortId(order.id) }}</h2>
                  <p class="mt-1 text-xs text-slate-500">{{ order.createdAtUtc | date: 'medium' }}</p>
                </div>
                <app-status-badge [status]="order.status" />
              </div>

              <div class="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div class="min-w-0">
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Total</p>
                  <p class="mt-1 whitespace-nowrap text-xl font-black tracking-[-0.03em] text-slate-950">{{ order.total | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
                </div>
                <div class="min-w-0 text-right">
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Pago</p>
                  <p class="mt-1 truncate text-sm font-bold text-slate-950">{{ paymentMethodLabel(order.paymentMethod) }}</p>
                  <p class="mt-0.5 truncate text-xs text-slate-500">{{ paymentStatusLabel(order.paymentStatus) }}</p>
                </div>
              </div>

              @if (showManualPaymentNotice(order)) {
                <div class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  Pago pendiente de confirmación.
                </div>
              } @else if (order.status === 'ReadyForPickup') {
                <div class="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                  Pedido listo para recojo o asignación de delivery.
                </div>
              }
            </app-surface-card>

            <app-surface-card variant="default" extraClass="grid min-w-0 gap-3 p-4">
              <div class="min-w-0">
                <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary-700">Cliente</p>
                <p class="mt-1 truncate text-sm font-bold text-slate-950" [title]="order.customerName">{{ order.customerName }}</p>
                @if (order.customerPhone) {
                  <p class="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                    <lucide-angular class="h-3.5 w-3.5 shrink-0" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                    <span class="truncate">{{ order.customerPhone }}</span>
                  </p>
                }
              </div>

              <div class="min-w-0 border-t border-slate-100 pt-3 flex flex-col justify-between">
                <div>
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary-700">Entrega</p>
                  <p class="mt-1 break-words text-sm font-semibold text-slate-900">{{ order.deliveryAddress }}</p>
                  @if (order.deliveryReference) {
                    <p class="mt-1 break-words text-xs text-slate-500">{{ order.deliveryReference }}</p>
                  }
                </div>
                @if (order.deliveryAddress) {
                  <a
                    [href]="buildGoogleMapsUrl(order.deliveryAddress)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                  >
                    <lucide-angular class="h-3.5 w-3.5 text-primary-700" [img]="navigationIcon" aria-hidden="true"></lucide-angular>
                    Ver en Google Maps
                  </a>
                }
              </div>

              @if (order.notes) {
                <div class="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Nota del cliente</p>
                  <p class="mt-1 break-words text-xs leading-5 text-slate-700">{{ order.notes }}</p>
                </div>
              }
            </app-surface-card>
          </div>
        </section>

        @if (refund(); as refundCase) {
          <app-surface-card variant="default" extraClass="grid gap-3 border-amber-200 bg-amber-50/60 p-4">
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-[0.14em] text-primary-700">Reembolso</span>
              <h3 class="text-sm font-black text-slate-950">Devuelve el pago con evidencia</h3>
              <p class="mt-0.5 text-xs text-slate-500">El estado solo cambiará a reembolsado cuando el cliente confirme que recibió el dinero.</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 text-sm"><app-status-badge [status]="refundCase.status" [label]="refundStatusLabel(refundCase.status)" /><strong>{{ refundCase.amount | currency: refundCase.currencyCode : 'S/ ' : '1.2-2' }}</strong></div>
            @if (refundCase.status === 'AwaitingBusinessRefund') {
              <label class="grid gap-1 text-sm font-bold text-slate-700">Número de operación<input class="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3" [value]="refundOperation()" (input)="refundOperation.set($any($event.target).value)" /></label>
              <label class="grid gap-1 text-sm font-bold text-slate-700">Comprobante privado<input class="w-full min-w-0 text-sm" type="file" accept="image/jpeg,image/png,image/webp" (change)="onRefundFileSelected($event)" /></label>
              <app-button type="button" size="sm" [disabled]="refundSubmitting() || !refundFile() || !refundOperation().trim()" (click)="submitRefundEvidence()" block>{{ refundSubmitting() ? 'Enviando…' : 'Registrar devolución' }}</app-button>
            } @else if (refundCase.status === 'AwaitingCustomerConfirmation') {
              <app-notice tone="info" message="Comprobante enviado. El cliente debe verificar su cuenta y confirmar o disputar la devolución." />
            } @else if (refundCase.status === 'Disputed') {
              <app-notice tone="danger" message="El cliente no reconoció la devolución. El caso requiere revisión administrativa." />
            }
          </app-surface-card>
        }

        @if (order.deliveryMode === 'CommunityCollaboratorDelivery' && order.assignedCourierType === 'Collaborator' && (order.status === 'Assigned' || order.status === 'ReadyForPickup')) {
          <app-surface-card variant="default" extraClass="grid gap-3 p-4">
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-[0.14em] text-primary-700">Recojo</span>
              <h3 class="text-sm font-black text-slate-950">Validar al colaborador</h3>
              <p class="mt-0.5 text-xs text-slate-500">Pide el código de seis dígitos antes de entregar el paquete.</p>
            </div>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-slate-700">Código de recojo</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-center text-lg font-black tracking-[0.2em]" inputmode="numeric" maxlength="6" [value]="pickupCode()" (input)="pickupCode.set($any($event.target).value)" />
            </label>
            <app-button type="button" [disabled]="isConfirmingPickup() || pickupCode().length !== 6" (click)="confirmCollaboratorPickup()" block>
              {{ isConfirmingPickup() ? 'Validando...' : 'Confirmar recojo' }}
            </app-button>
          </app-surface-card>
        }

        @if ((order.deliveryMode === 'PickupOrDirect' && order.status === 'ReadyForPickup') || (order.deliveryMode === 'BusinessDelivery' && order.status === 'OnTheWay')) {
          <app-surface-card variant="default" extraClass="grid gap-3 p-4">
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-[0.14em] text-primary-700">Entrega segura</span>
              <h3 class="text-sm font-black text-slate-950">Confirmar entrega</h3>
              <p class="mt-0.5 text-xs text-slate-500">Solicita al cliente el código de seis dígitos cuando ya tenga su pedido.</p>
            </div>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-slate-700">Código de entrega</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-center text-lg font-black tracking-[0.2em]" inputmode="numeric" maxlength="6" [value]="deliveryCode()" (input)="deliveryCode.set($any($event.target).value)" />
            </label>
            <app-button type="button" [disabled]="isSubmitting() || deliveryCode().length !== 6" (click)="confirmBusinessDelivery()" block>
              {{ isSubmitting() ? 'Confirmando...' : 'Confirmar entrega' }}
            </app-button>
          </app-surface-card>
        }

        <app-surface-card variant="default" extraClass="grid w-full min-w-0 max-w-full gap-3 p-3.5 sm:p-4">
          <div class="flex items-center gap-2">
            <lucide-angular class="h-4 w-4 text-primary-700" [img]="packageIcon" aria-hidden="true"></lucide-angular>
            <h3 class="text-base font-extrabold tracking-[-0.02em] text-slate-950">Productos del pedido</h3>
          </div>

          <div class="grid gap-3">
            @for (item of order.items; track item.productName + '-' + item.unitPrice) {
              <div class="grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-slate-50 p-2.5 min-[390px]:grid-cols-[52px_minmax(0,1fr)_auto]">
                <div class="overflow-hidden rounded-[14px] bg-slate-100">
                  @if (item.imageUrl) {
                    <img class="h-[52px] w-full object-cover object-center" [src]="item.imageUrl" [alt]="item.productName" />
                  } @else {
                    <div class="grid h-[52px] w-full place-items-center bg-slate-100 text-slate-500">
                      <lucide-angular class="h-5 w-5" [img]="packageIcon" aria-hidden="true"></lucide-angular>
                    </div>
                  }
                </div>

                <div class="min-w-0">
                  <p class="line-clamp-2 break-words text-sm font-bold text-slate-950">{{ item.productName }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.quantity }} × {{ item.unitPrice | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
                </div>

                <p class="col-start-2 whitespace-nowrap text-sm font-black text-slate-950 min-[390px]:col-start-auto">{{ item.subtotal | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
              </div>
            }
          </div>

          <div class="grid gap-2 border-t border-slate-100 pt-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Subtotal</span>
              <strong class="text-slate-950">{{ order.subtotal | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Delivery</span>
              <strong class="text-slate-950">{{ order.deliveryFee | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
              <span class="font-bold text-slate-950">Total</span>
              <strong class="text-base font-black text-slate-950">{{ order.total | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong>
            </div>
          </div>
        </app-surface-card>

        @if (availableActions().length) {
          <app-bottom-safe-action-bar mode="fixed">
            <div class="grid gap-2" [class.grid-cols-2]="availableActions().length > 1" [class.grid-cols-1]="availableActions().length === 1">
              @for (action of availableActions(); track action.label) {
                <app-button
                  [variant]="action.variant === 'danger' ? 'danger' : 'primary'"
                  size="md"
                  type="button"
                  [block]="true"
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
            class="w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
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

  readonly phoneIcon = Phone;
  readonly packageIcon = Package;
  readonly cookingIcon = CookingPot;
  readonly acceptIcon = ShieldCheck;
  readonly readyIcon = BadgeCheck;
  readonly cancelIcon = CircleSlash;
  readonly navigationIcon = Navigation;
  readonly buildGoogleMapsUrl = buildGoogleMapsUrl;

  readonly order = signal<BusinessOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly rejectConfirmationOpen = signal(false);
  readonly pickupCode = signal('');
  readonly isConfirmingPickup = signal(false);
  readonly deliveryCode = signal('');
  readonly refund = signal<RefundResponse | null>(null);
  readonly refundOperation = signal('');
  readonly refundFile = signal<File | null>(null);
  readonly refundSubmitting = signal(false);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly availableActions = computed(() => this.getActions(this.order()));

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
          if (order.paymentStatus === 'RefundPending' || order.paymentStatus === 'Refunded') this.loadRefund();
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
        return 'Método registrado';
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
      case 'RefundPending':
        return 'Devolución pendiente';
      default:
        return 'Estado por revisar';
    }
  }

  refundStatusLabel(status: string): string {
    return ({ AwaitingBusinessRefund: 'Debes devolver el pago', AwaitingCustomerConfirmation: 'Esperando al cliente', Completed: 'Completado', Disputed: 'En disputa', Rejected: 'Rechazado', Failed: 'Fallido' } as Record<string, string>)[status] ?? status;
  }

  onRefundFileSelected(event: Event): void {
    this.refundFile.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  submitRefundEvidence(): void {
    const refund = this.refund();
    const file = this.refundFile();
    if (!refund || !file || !this.refundOperation().trim()) return;
    this.refundSubmitting.set(true);
    this.businessOrdersApi.submitRefundEvidence(refund.id, this.refundOperation().trim(), refund.amount, new Date().toISOString(), file)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (result) => { this.refund.set(result); this.refundSubmitting.set(false); this.refundFile.set(null); this.notificationService.success('Devolución reportada. Esperando confirmación del cliente.'); },
        error: (error) => { this.refundSubmitting.set(false); this.notificationService.error(getErrorMessage(error, 'No se pudo registrar el comprobante de devolución.')); },
      });
  }

  private loadRefund(): void {
    this.businessOrdersApi.getRefund(this.orderId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (result) => this.refund.set(result), error: () => this.refund.set(null) });
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

  confirmCollaboratorPickup(): void {
    if (this.pickupCode().length !== 6) return;
    this.isConfirmingPickup.set(true);
    this.businessOrdersApi.confirmCollaboratorPickup(this.orderId, this.pickupCode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isConfirmingPickup.set(false);
          this.pickupCode.set('');
          this.notificationService.success('Recojo confirmado. El pedido ya va en camino.');
          this.loadOrder();
        },
        error: (error) => {
          this.isConfirmingPickup.set(false);
          this.notificationService.error(getErrorMessage(error, 'No pudimos validar el código de recojo.'));
        },
      });
  }

  handleAction(action: BusinessOrderAction): void {
    if (action.kind === 'dispatch') {
      this.dispatchBusinessDelivery();
      return;
    }
    if (!action.status) return;
    if (action.status === 'Cancelled') {
      this.rejectConfirmationOpen.set(true);
      return;
    }

    this.runStatusUpdate(action.status);
  }

  dispatchBusinessDelivery(): void {
    this.isSubmitting.set(true);
    this.businessOrdersApi.dispatchBusinessDelivery(this.orderId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (order) => { this.order.set(order); this.isSubmitting.set(false); this.notificationService.success('Pedido despachado.'); },
      error: (error) => { this.isSubmitting.set(false); this.notificationService.error(getErrorMessage(error, 'No se pudo despachar el pedido.')); },
    });
  }

  confirmBusinessDelivery(): void {
    if (this.deliveryCode().length !== 6) return;
    this.isSubmitting.set(true);
    this.businessOrdersApi.confirmBusinessDelivery(this.orderId, this.deliveryCode()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (order) => { this.order.set(order); this.deliveryCode.set(''); this.isSubmitting.set(false); this.notificationService.success('Entrega confirmada.'); },
      error: (error) => { this.isSubmitting.set(false); this.errorMessage.set(getErrorMessage(error, 'No se pudo confirmar la entrega.')); },
    });
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

  private getActions(order: BusinessOrderDetailResponse | null): BusinessOrderAction[] {
    if (!order) return [];
    switch (order.status) {
      case 'Pending':
        return [
          { label: 'Aceptar pedido', status: 'Accepted' },
          { label: 'Rechazar pedido', status: 'Cancelled', variant: 'danger' },
        ];
      case 'Accepted':
        return [{ label: 'Marcar en preparación', status: 'Preparing' }];
      case 'Preparing':
        return [{ label: 'Marcar como listo', status: 'ReadyForPickup' }];
      case 'ReadyForPickup':
        return order.deliveryMode === 'BusinessDelivery' ? [{ label: 'Despachar pedido', kind: 'dispatch' }] : [];
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
