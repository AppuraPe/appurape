import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CircleSlash,
  CircleX,
  CookingPot,
  CreditCard,
  FilterX,
  LucideAngularModule,
  ReceiptText,
  Search,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import {
  BusinessOrderListItemResponse,
  BusinessOrderPaymentResponse,
  BusinessOrderStatus,
} from '../../core/models/business.model';
import { BusinessOrdersApiService } from '../../core/services/business-orders-api.service';
import { PaymentEvidenceResponse } from '../../core/models/orders.models';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { toOrderStatusValue } from '../../core/utils/order-status.utils';
import { ActionChipRowComponent } from '../../shared/components/action-chip-row.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

interface BusinessOrderAction {
  label: string;
  status: BusinessOrderStatus | 'Cancelled';
  variant?: 'danger';
}

type PaymentActionMode = 'confirm' | 'reject';

@Component({
  selector: 'app-business-orders-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    ActionChipRowComponent,
  ],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      [bottomSpacingClass]="'pb-0'"
      [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'"
      [extraClass]="'grid w-full min-w-0 max-w-4xl gap-3.5 overflow-x-hidden pt-1 lg:gap-4'"
    >
      <section class="grid w-full min-w-0 max-w-full gap-3.5 px-0.5" aria-labelledby="business-orders-title">
        <div class="min-w-0">
          <div class="flex min-w-0 items-center justify-between gap-3">
            <span class="inline-flex min-h-7 items-center rounded-full bg-primary-100 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary-700">
              Negocio
            </span>
            <span class="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
              {{ orders().length }} visibles
            </span>
          </div>
          <h1 id="business-orders-title" class="mt-2 text-[1.35rem] font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-2xl">
            Pedidos del negocio
          </h1>
          <p class="mt-1 max-w-full text-sm leading-5 text-slate-500">
            Bandeja móvil para aceptar, preparar y dejar pedidos listos.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="min-w-0 rounded-2xl bg-white px-2.5 py-3 text-center shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.05em] text-slate-500">Nuevos</p>
            <p class="mt-1 text-[1.35rem] font-black leading-none text-amber-700">{{ ordersByStatus('Pending') }}</p>
          </div>
          <div class="min-w-0 rounded-2xl bg-white px-2.5 py-3 text-center shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.05em] text-slate-500">En cocina</p>
            <p class="mt-1 text-[1.35rem] font-black leading-none text-sky-700">{{ ordersByStatus('Preparing') }}</p>
          </div>
          <div class="min-w-0 rounded-2xl bg-white px-2.5 py-3 text-center shadow-sm">
            <p class="text-[10px] font-black uppercase tracking-[0.05em] text-slate-500">Listos</p>
            <p class="mt-1 text-[1.35rem] font-black leading-none text-emerald-700">{{ ordersByStatus('ReadyForPickup') }}</p>
          </div>
        </div>

        <form class="grid gap-2.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid gap-1.5">
            <span class="sr-only">Buscar pedido</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="restaurantOrderSearch"
                type="search"
                formControlName="q"
                placeholder="Cliente, teléfono o dirección"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:ring-0"
              />
            </div>
          </label>

          <label class="grid gap-1.5">
            <span class="sr-only">Estado</span>
            <select
              id="restaurantOrderStatus"
              formControlName="status"
              class="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
            >
              <option value="">Todos</option>
              <option value="Pending">Pendiente</option>
              <option value="Accepted">Aceptado</option>
              <option value="Preparing">En preparación</option>
              <option value="ReadyForPickup">Listo para recoger</option>
              <option value="Assigned">Repartidor asignado</option>
              <option value="PickedUp">Recogido</option>
              <option value="OnTheWay">En camino</option>
              <option value="Delivered">Entregado</option>
              <option value="Cancelled">Cancelado</option>
            </select>
          </label>

          <div class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:items-end xl:justify-end">
            <app-button type="submit" size="sm" [disabled]="isLoading() || !!actionOrderId() || paymentSheetSubmitting()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button
              variant="secondary"
              type="button"
              size="sm"
              (click)="clearFilters()"
              [disabled]="isLoading() || !!actionOrderId() || paymentSheetSubmitting()"
            >
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
        </form>

        <app-action-chip-row class="[contain:inline-size]" aria-label="Accesos rápidos por estado">
          <button
            class="min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition"
            [class]="!filtersForm.controls.status.value ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'"
            type="button"
            (click)="filtersForm.controls.status.setValue('')"
          >
            Todos
          </button>
          @for (status of ['Pending', 'Preparing', 'ReadyForPickup']; track status) {
            <button
              class="min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition"
              [class]="filtersForm.controls.status.value === status ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'"
              type="button"
              (click)="filtersForm.controls.status.setValue(status)"
            >
              {{ readableOrderStatus(status) }}
            </button>
          }
        </app-action-chip-row>
      </section>

      <app-notice class="hidden"
        tone="info"
        title="Flujo permitido"
        message="El flujo del negocio es: pendiente, aceptado, en preparación y listo para recoger. Solo puedes cancelar antes de que el pedido esté listo."
      />

      @if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando pedidos" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-[84px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5">
              <div class="flex h-full min-w-0 items-center gap-3">
                <div class="h-10 w-10 shrink-0 rounded-xl bg-slate-200"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="h-2.5 w-1/2 rounded-full bg-slate-100"></div>
                </div>
                <div class="h-6 w-16 shrink-0 rounded-full bg-slate-100"></div>
              </div>
            </div>
          }
        </div>
      } @else if (errorMessage()) {
        <app-surface-card variant="page" extraClass="p-5">
          <app-notice tone="danger" [message]="errorMessage()" />
          <div class="mt-4">
            <app-button type="button" variant="secondary" (click)="loadOrders()">Reintentar</app-button>
          </div>
        </app-surface-card>
      } @else if (!orders().length) {
        <app-unified-empty-state title="Aún no tienes pedidos" message="Cuando entren pedidos al negocio aparecerán aquí para gestionarlos."></app-unified-empty-state>
      } @else {
        <div class="grid gap-3">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-3.5 sm:p-4">
              <div class="grid min-w-0 gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto] min-[390px]:items-start">
                <div class="min-w-0">
                  <strong class="block truncate text-[15px] font-extrabold tracking-[-0.02em] text-slate-950" [title]="order.customerName">{{ order.customerName }}</strong>
                  <p class="mt-1 truncate text-xs text-slate-500">
                    Pedido {{ shortId(order.id) }} · {{ order.createdAtUtc | date: 'short' }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <app-status-badge [status]="order.status" />
                  <app-status-badge [status]="order.paymentStatus" [label]="paymentStatusLabel(order.paymentStatus)" prefix="Pago" />
                </div>
              </div>

              <div class="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-slate-100 pt-3">
                <div class="min-w-0">
                  <p class="truncate text-xs font-bold text-slate-700">{{ order.itemCount }} productos</p>
                  <p class="mt-1 truncate text-xs text-slate-500">{{ paymentMethodLabel(order.paymentMethod) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Total</p>
                  <p class="whitespace-nowrap text-base font-black tabular-nums tracking-[-0.04em] text-slate-950 min-[360px]:text-lg">{{ order.total | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
                </div>
              </div>

              @if (isManualPayment(order.paymentMethod)) {
                <div class="mt-3 rounded-xl border border-primary-100 bg-primary-50/70 px-3 py-2">
                  <p class="text-xs font-bold text-primary-800">Pago manual</p>
                  @if (paymentSummary(order.id); as paymentSummary) {
                    @if (paymentSummary.manualReference) {
                      <p class="mt-0.5 truncate text-xs text-slate-600">Referencia: {{ paymentSummary.manualReference }}</p>
                    }
                    @if (paymentSummary.failureReason) {
                      <p class="mt-0.5 break-words text-xs text-red-700">{{ paymentSummary.failureReason }}</p>
                    }
                  }
                </div>
              }

              <div class="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <app-button size="sm" type="button" variant="secondary" [routerLink]="['/business/orders', order.id]">
                  Ver detalle
                </app-button>

                  @if (canManagePayment(order)) {
                  <app-button variant="secondary" size="sm" type="button" (click)="openPaymentSheet(order, 'confirm')" [disabled]="actionOrderId() === order.id || paymentSheetSubmitting()">
                    Confirmar pago
                  </app-button>
                  <app-button variant="ghost" size="sm" type="button" (click)="openPaymentSheet(order, 'reject')" [disabled]="actionOrderId() === order.id || paymentSheetSubmitting()">
                    Rechazar pago
                  </app-button>
                  }

                  @if (getActions(order.status).length) {
                  @for (action of getActions(order.status); track action.label) {
                    <app-button [variant]="action.variant === 'danger' ? 'danger' : 'primary'" size="sm" type="button" (click)="updateStatus(order, action)" [disabled]="actionOrderId() === order.id || paymentSheetSubmitting()">
                      {{ actionOrderId() === order.id ? 'Procesando...' : action.label }}
                    </app-button>
                  }
                }
              </div>
            </app-surface-card>
          }
        </div>
      }

      @if (rejectConfirmationOrder(); as rejectOrder) {
        <div class="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" (click)="closeRejectConfirmation()"></div>
        <div class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-3 pb-3 sm:inset-0 sm:grid sm:place-items-center sm:px-6 sm:py-8">
          <section
            class="w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">¿Seguro que deseas rechazar este pedido?</h2>
            <p class="mt-2 text-sm text-slate-500">El pedido {{ shortId(rejectOrder.id) }} se cancelará y ya no seguirá el flujo operativo.</p>

            <div class="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <app-button type="button" variant="ghost" size="md" (click)="closeRejectConfirmation()" [disabled]="!!actionOrderId()">
                Cancelar
              </app-button>
              <app-button type="button" variant="danger" size="md" (click)="confirmReject()" [disabled]="!!actionOrderId()">
                {{ actionOrderId() === rejectOrder.id ? 'Procesando...' : 'Rechazar pedido' }}
              </app-button>
            </div>
          </section>
        </div>
      }

      @if (paymentSheetOrder(); as paymentOrder) {
        <div class="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" (click)="closePaymentSheet()"></div>
        <div class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl px-3 pb-3 sm:inset-0 sm:grid sm:place-items-center sm:px-6 sm:py-8">
          <section
            class="w-full rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div class="min-w-0">
                <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Pago manual</p>
                <h2 class="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
                  {{ paymentSheetMode() === 'confirm' ? 'Confirmar pago' : 'Rechazar pago' }}
                </h2>
                <p class="mt-1 text-sm text-slate-500">Pedido {{ shortId(paymentOrder.id) }} · {{ paymentOrder.customerName }}</p>
              </div>

              <button
                type="button"
                class="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                (click)="closePaymentSheet()"
                [disabled]="paymentSheetSubmitting()"
                aria-label="Cerrar"
              >
                <lucide-angular class="h-5 w-5" [img]="closeIcon" aria-hidden="true"></lucide-angular>
              </button>
            </div>

            <div class="grid gap-4 px-4 py-4 sm:px-6 sm:py-5">
              @if (paymentSheetError()) {
                <app-notice tone="danger" [message]="paymentSheetError()" />
              }

              @if (paymentSheetLoading()) {
                <app-unified-loading-state label="Consultando el pago" />
              } @else if (selectedPayment(); as payment) {
                <div class="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mobileWalletIcon" aria-hidden="true"></lucide-angular>
                    {{ paymentMethodLabel(payment.method) }}
                  </div>
                  <div class="grid gap-2 text-sm text-slate-900">
                    <p>Estado: <span class="font-bold" [class]="paymentStatusClass(payment.status)">{{ paymentStatusLabel(payment.status) }}</span></p>
                    <p>Monto: <span class="font-bold">{{ payment.amount | currency: payment.currency : 'S/ ' : '1.2-2' }}</span></p>
                    @if (payment.manualReference) {
                      <p>Referencia actual: <span class="font-bold">{{ payment.manualReference }}</span></p>
                    }
                    @if (payment.failureReason) {
                      <p class="text-red-700">Motivo de rechazo: <span class="font-bold">{{ payment.failureReason }}</span></p>
                    }
                  </div>
                </div>

                @if (paymentEvidence(); as evidence) {
                  <div class="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm">
                    <div class="flex min-w-0 items-center justify-between gap-3">
                      <p class="min-w-0 font-extrabold text-emerald-950">Comprobante enviado por el cliente</p>
                      <app-button type="button" variant="secondary" size="sm" (click)="viewPaymentEvidence(evidence.id)">
                        Ver captura
                      </app-button>
                    </div>
                    <dl class="grid grid-cols-2 gap-2 text-slate-700">
                      <div class="min-w-0"><dt class="text-xs text-slate-500">Operación</dt><dd class="truncate font-bold">{{ evidence.operationNumber }}</dd></div>
                      <div><dt class="text-xs text-slate-500">Monto declarado</dt><dd class="font-bold">{{ evidence.declaredAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</dd></div>
                      <div class="col-span-2"><dt class="text-xs text-slate-500">Fecha declarada</dt><dd class="font-bold">{{ evidence.paidAtUtc | date: 'dd/MM/yyyy, HH:mm' }}</dd></div>
                    </dl>
                    <p class="text-xs leading-5 text-emerald-900">Comprueba el ingreso en tu propia cuenta Yape/Plin. La captura no confirma el pago por sí sola.</p>
                  </div>
                } @else {
                  <app-notice tone="danger" title="Falta el comprobante" message="No confirmes el pago hasta que el cliente envíe su número de operación y captura." />
                }

                <app-notice
                  tone="warning"
                  [title]="paymentSheetMode() === 'confirm' ? 'Confirma antes de registrar el pago' : 'Confirma antes de rechazar el pago'"
                  [message]="paymentSheetMode() === 'confirm'
                    ? 'Esta acción marcará el pago como pagado para este pedido.'
                    : 'Esta acción dejará el pago como rechazado para este pedido.'"
                />

                <app-button type="button" variant="ghost" size="sm" [disabled]="paymentSheetSubmitting()" (click)="openPaymentReview(payment.paymentId)">
                  Enviar a revisión de AppuraPe
                </app-button>

                <form class="grid gap-4" [formGroup]="paymentActionForm" (ngSubmit)="submitPaymentAction()">
                  @if (paymentSheetMode() === 'reject') {
                    <label class="grid gap-2">
                      <span class="text-sm font-semibold text-slate-900">Motivo del rechazo</span>
                      <textarea
                        rows="3"
                        formControlName="failureReason"
                        maxlength="500"
                        placeholder="Describe por qué el pago no pudo confirmarse"
                        class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
                      ></textarea>
                    </label>
                  }

                  <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <app-button type="button" variant="ghost" size="md" (click)="closePaymentSheet()" [disabled]="paymentSheetSubmitting()">
                      Cancelar
                    </app-button>
                    <app-button type="submit" size="md" [disabled]="paymentSheetSubmitting() || paymentSheetLoading() || (paymentSheetMode() === 'confirm' && !paymentEvidence())">
                      {{ paymentSheetSubmitting() ? 'Procesando...' : paymentSheetMode() === 'confirm' ? 'Confirmar pago' : 'Rechazar pago' }}
                    </app-button>
                  </div>
                </form>
              }
            </div>
          </section>
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class BusinessOrdersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly businessOrdersApi = inject(BusinessOrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly receiptIcon = ReceiptText;
  readonly walletIcon = Wallet;
  readonly creditCardIcon = CreditCard;
  readonly mobileWalletIcon = Smartphone;
  readonly cookingIcon = CookingPot;
  readonly shieldIcon = ShieldCheck;
  readonly cancelIcon = CircleSlash;
  readonly closeIcon = CircleX;

  readonly orders = signal<BusinessOrderListItemResponse[]>([]);
  readonly paymentByOrderId = signal<Record<string, BusinessOrderPaymentResponse>>({});
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly actionOrderId = signal<string | null>(null);
  readonly rejectConfirmationOrder = signal<BusinessOrderListItemResponse | null>(null);
  readonly paymentSheetOrder = signal<BusinessOrderListItemResponse | null>(null);
  readonly paymentSheetMode = signal<PaymentActionMode | null>(null);
  readonly paymentSheetLoading = signal(false);
  readonly paymentSheetSubmitting = signal(false);
  readonly paymentSheetError = signal('');
  readonly paymentEvidence = signal<PaymentEvidenceResponse | null>(null);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    status: [''],
  });

  readonly paymentActionForm = this.formBuilder.nonNullable.group({
    manualReference: ['', [Validators.maxLength(120)]],
    failureReason: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadOrders();
    });

    this.loadOrders();
  }

  ordersByStatus(status: string): number {
    return this.orders().filter((order) => order.status === status).length;
  }

  loadOrders(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.businessOrdersApi
      .getOrders({
        q: filters.q,
        status: filters.status || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los pedidos.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
        status: '',
      },
      { emitEvent: false },
    );
    this.loadOrders();
  }

  shortId(id: string): string {
    return id.slice(0, 8);
  }

  isManualPayment(method: string): boolean {
    return ['yape', 'plin'].includes(method.trim().toLowerCase());
  }

  paymentMethodLabel(method: string): string {
    switch (method.trim().toLowerCase()) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'yape':
        return 'Yape';
      case 'plin':
        return 'Plin';
      default:
        return 'Método registrado';
    }
  }

  canManagePayment(order: BusinessOrderListItemResponse): boolean {
    return this.isManualPayment(order.paymentMethod) && order.paymentStatus === 'PendingConfirmation';
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
        return 'Estado por revisar';
    }
  }

  readableOrderStatus(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Accepted':
        return 'Aceptado';
      case 'Preparing':
        return 'En preparación';
      case 'ReadyForPickup':
        return 'Listo para recoger';
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

  paymentStatusClass(status: string): string {
    switch (status) {
      case 'Paid':
        return 'text-emerald-700';
      case 'Rejected':
      case 'Failed':
        return 'text-red-700';
      case 'PendingConfirmation':
        return 'text-amber-700';
      default:
        return 'text-slate-500';
    }
  }

  paymentSummary(orderId: string): BusinessOrderPaymentResponse | null {
    return this.paymentByOrderId()[orderId] ?? null;
  }

  selectedPayment(): BusinessOrderPaymentResponse | null {
    const orderId = this.paymentSheetOrder()?.id;
    return orderId ? this.paymentByOrderId()[orderId] ?? null : null;
  }

  getActions(status: string): BusinessOrderAction[] {
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

  updateStatus(order: BusinessOrderListItemResponse, action: BusinessOrderAction): void {
    if (action.status === 'Cancelled') {
      this.rejectConfirmationOrder.set(order);
      return;
    }

    this.actionOrderId.set(order.id);
    this.errorMessage.set('');

    this.businessOrdersApi
      .updateOrderStatus(order.id, { status: toOrderStatusValue(action.status) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.success(this.statusSuccessMessage(action.status));
          this.actionOrderId.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el pedido. Intenta nuevamente.'));
          this.actionOrderId.set(null);
          if (error?.status === 403) {
            this.notificationService.warning('No tienes permisos para gestionar este pedido.');
            return;
          }

          this.notificationService.error('No se pudo actualizar el pedido. Intenta nuevamente.');
        },
      });
  }

  closeRejectConfirmation(): void {
    if (this.actionOrderId()) {
      return;
    }

    this.rejectConfirmationOrder.set(null);
  }

  confirmReject(): void {
    const order = this.rejectConfirmationOrder();

    if (!order) {
      return;
    }

    this.actionOrderId.set(order.id);
    this.errorMessage.set('');

    this.businessOrdersApi
      .updateOrderStatus(order.id, { status: toOrderStatusValue('Cancelled') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.success('Pedido rechazado.');
          this.actionOrderId.set(null);
          this.rejectConfirmationOrder.set(null);
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el pedido. Intenta nuevamente.'));
          this.actionOrderId.set(null);
          this.rejectConfirmationOrder.set(null);
          if (error?.status === 403) {
            this.notificationService.warning('No tienes permisos para gestionar este pedido.');
            return;
          }

          this.notificationService.error('No se pudo actualizar el pedido. Intenta nuevamente.');
        },
      });
  }

  openPaymentSheet(order: BusinessOrderListItemResponse, mode: PaymentActionMode): void {
    this.paymentSheetOrder.set(order);
    this.paymentSheetMode.set(mode);
    this.paymentSheetLoading.set(true);
    this.paymentSheetSubmitting.set(false);
    this.paymentSheetError.set('');
    this.paymentEvidence.set(null);
    this.paymentActionForm.reset(
      {
        manualReference: '',
        failureReason: '',
      },
      { emitEvent: false },
    );

    this.businessOrdersApi
      .getOrderPayment(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) => {
          this.setPaymentSummary(payment);
          this.paymentActionForm.patchValue(
            {
              manualReference: payment.manualReference ?? '',
              failureReason: payment.failureReason ?? '',
            },
            { emitEvent: false },
          );
          this.businessOrdersApi.getPaymentEvidence(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (evidence) => {
              this.paymentEvidence.set(evidence);
              this.paymentSheetLoading.set(false);
            },
            error: () => {
              this.paymentEvidence.set(null);
              this.paymentSheetLoading.set(false);
            },
          });
        },
        error: (error) => {
          this.paymentSheetError.set(getErrorMessage(error, `No se pudo consultar el pago del pedido ${this.shortId(order.id)}.`));
          this.paymentSheetLoading.set(false);
        },
      });
  }

  closePaymentSheet(): void {
    if (this.paymentSheetSubmitting()) {
      return;
    }

    this.paymentSheetOrder.set(null);
    this.paymentSheetMode.set(null);
    this.paymentSheetLoading.set(false);
    this.paymentSheetError.set('');
    this.paymentEvidence.set(null);
    this.paymentActionForm.reset(
      {
        manualReference: '',
        failureReason: '',
      },
      { emitEvent: false },
    );
  }

  submitPaymentAction(): void {
    const order = this.paymentSheetOrder();
    const mode = this.paymentSheetMode();

    if (!order || !mode || this.paymentSheetLoading()) {
      return;
    }

    if (mode === 'confirm' && !this.paymentEvidence()) {
      this.paymentSheetError.set('El cliente debe enviar un comprobante antes de confirmar el pago.');
      return;
    }

    if (mode === 'reject') {
      const reason = this.paymentActionForm.controls.failureReason.value.trim();
      if (!reason) {
        this.paymentSheetError.set('Debes ingresar un motivo para rechazar el pago.');
        return;
      }
    }

    this.paymentSheetSubmitting.set(true);
    this.paymentSheetError.set('');
    this.errorMessage.set('');

    const request$ =
      mode === 'confirm'
        ? this.businessOrdersApi.confirmOrderPayment(order.id, {
            manualReference: this.paymentActionForm.controls.manualReference.value.trim() || null,
          })
        : this.businessOrdersApi.rejectOrderPayment(order.id, {
            failureReason: this.paymentActionForm.controls.failureReason.value.trim(),
          });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (payment) => {
        this.setPaymentSummary(payment);
        this.patchOrderPaymentStatus(payment.orderId, payment.status);
        this.notificationService.success(
          mode === 'confirm'
            ? `Pago del pedido ${this.shortId(order.id)} confirmado correctamente.`
            : `Pago del pedido ${this.shortId(order.id)} rechazado correctamente.`,
        );
        this.paymentSheetSubmitting.set(false);
        this.closePaymentSheet();
      },
      error: (error) => {
        this.paymentSheetError.set(getErrorMessage(error, `No se pudo ${mode === 'confirm' ? 'confirmar' : 'rechazar'} el pago.`));
        this.paymentSheetSubmitting.set(false);
      },
    });
  }

  openPaymentReview(paymentId: string): void {
    const reason = prompt('Describe por qué el pago necesita revisión de AppuraPe:')?.trim();
    if (!reason) return;
    this.paymentSheetSubmitting.set(true);
    this.businessOrdersApi.openPaymentReview(paymentId, reason).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.paymentSheetSubmitting.set(false);
        this.notificationService.warning('Pago enviado a revisión administrativa.');
        this.closePaymentSheet();
        this.loadOrders();
      },
      error: (error) => {
        this.paymentSheetSubmitting.set(false);
        this.paymentSheetError.set(getErrorMessage(error, 'No se pudo abrir la revisión.'));
      },
    });
  }

  viewPaymentEvidence(evidenceId: string): void {
    this.businessOrdersApi.downloadPaymentEvidence(evidenceId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (error) => this.paymentSheetError.set(getErrorMessage(error, 'No se pudo abrir el comprobante privado.')),
    });
  }

  private setPaymentSummary(payment: BusinessOrderPaymentResponse): void {
    this.paymentByOrderId.update((current) => ({
      ...current,
      [payment.orderId]: payment,
    }));
  }

  private patchOrderPaymentStatus(orderId: string, paymentStatus: string): void {
    this.orders.update((current) => current.map((order) => (order.id === orderId ? { ...order, paymentStatus } : order)));
  }

  private statusSuccessMessage(status: BusinessOrderStatus): string {
    switch (status) {
      case 'Accepted':
        return 'Pedido aceptado.';
      case 'Preparing':
        return 'Pedido marcado en preparación.';
      case 'ReadyForPickup':
        return 'Pedido marcado como listo.';
      default:
        return 'Pedido actualizado.';
    }
  }
}
