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
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { toOrderStatusValue } from '../../core/utils/order-status.utils';
import { ActionChipRowComponent } from '../../shared/components/action-chip-row.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
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

type PaymentActionMode = 'confirm' | 'reject';

@Component({
  selector: 'app-business-orders-page',
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
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    ActionChipRowComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(88px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4 lg:gap-6'">
      <app-surface-card variant="page" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="Negocio"
          title="Pedidos del negocio"
          subtitle="Gestiona el tramo operativo real desde que entra el pedido hasta que queda listo para pickup."
          [meta]="orders().length + ' visibles'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Pedidos</p>
            <p class="mt-2 text-2xl font-black leading-none text-slate-950">{{ orders().length }}</p>
            <p class="mt-1 text-xs text-slate-500">Resultados visibles en la lista</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Pendientes</p>
            <p class="mt-2 text-2xl font-black leading-none text-amber-700">{{ ordersByStatus('Pending') }}</p>
            <p class="mt-1 text-xs text-slate-500">Aún sin aceptar</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Preparando</p>
            <p class="mt-2 text-2xl font-black leading-none text-sky-700">{{ ordersByStatus('Preparing') }}</p>
            <p class="mt-1 text-xs text-slate-500">En cocina ahora</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Listos pickup</p>
            <p class="mt-2 text-2xl font-black leading-none text-emerald-700">{{ ordersByStatus('ReadyForPickup') }}</p>
            <p class="mt-1 text-xs text-slate-500">Esperando recolección</p>
          </div>
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="p-4 sm:p-5">
        <form class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadOrders()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-slate-900">Buscar pedido</span>
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

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-slate-900">Estado</span>
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

          <div class="flex flex-wrap items-end gap-3 xl:justify-end">
            <app-button type="submit" [disabled]="isLoading() || !!actionOrderId() || paymentSheetSubmitting()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button
              variant="secondary"
              type="button"
              (click)="clearFilters()"
              [disabled]="isLoading() || !!actionOrderId() || paymentSheetSubmitting()"
            >
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
        </form>

        <app-action-chip-row class="mt-4">
          <button
            class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition"
            [class]="!filtersForm.controls.status.value ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'"
            type="button"
            (click)="filtersForm.controls.status.setValue('')"
          >
            Todos
          </button>
          @for (status of ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'OnTheWay', 'Delivered', 'Cancelled']; track status) {
            <button
              class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition"
              [class]="filtersForm.controls.status.value === status ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700'"
              type="button"
              (click)="filtersForm.controls.status.setValue(status)"
            >
              {{ readableOrderStatus(status) }}
            </button>
          }
        </app-action-chip-row>
      </app-surface-card>

      <app-notice
        tone="info"
        title="Flujo permitido"
        message="Los pedidos avanzan Pending -> Accepted -> Preparing -> ReadyForPickup. Solo puedes cancelar antes de que estén listos para pickup."
      />

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando pedidos" />
          <app-unified-loading-state label="Actualizando operación" />
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
        <div class="grid gap-4">
          @for (order of orders(); track order.id) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1 min-w-0">
                      <strong class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">{{ order.customerName }}</strong>
                      <span class="text-sm text-slate-500">Pedido {{ shortId(order.id) }}</span>
                      <span class="text-sm text-slate-500">{{ order.createdAtUtc | date: 'medium' }}</span>
                      <span class="text-sm text-slate-500">{{ order.itemCount }} ítems</span>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="order.status" />
                    <app-status-badge [status]="order.paymentStatus" [label]="paymentStatusLabel(order.paymentStatus)" prefix="Pago" />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                        Total
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">{{ order.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="creditCardIcon" aria-hidden="true"></lucide-angular>
                        Pago
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-950">{{ order.paymentMethod }}</p>
                      <p class="mt-1 text-xs font-semibold" [class]="paymentStatusClass(order.paymentStatus)">
                        {{ paymentStatusLabel(order.paymentStatus) }}
                      </p>

                      @if (isManualPayment(order.paymentMethod)) {
                        <div class="mt-3 rounded-2xl border border-primary-100 bg-primary-50/80 px-3 py-2">
                          <div class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-700">
                            <lucide-angular class="h-3.5 w-3.5" [img]="mobileWalletIcon" aria-hidden="true"></lucide-angular>
                            Pago manual
                          </div>
                          <p class="mt-1 text-xs text-slate-500">
                            Estado actual:
                            <span class="font-semibold text-slate-900">{{ paymentStatusLabel(order.paymentStatus) }}</span>
                          </p>
                          @if (paymentSummary(order.id); as paymentSummary) {
                            @if (paymentSummary.manualReference) {
                              <p class="mt-1 text-xs text-slate-500">Referencia: {{ paymentSummary.manualReference }}</p>
                            }
                            @if (paymentSummary.failureReason) {
                              <p class="mt-1 text-xs text-red-700">{{ paymentSummary.failureReason }}</p>
                            }
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <app-button size="md" type="button" variant="secondary" [routerLink]="['/business/orders', order.id]">
                      Ver detalle
                    </app-button>
                  </div>

                  @if (canManagePayment(order)) {
                    <div class="flex flex-wrap gap-3">
                      <app-button
                        variant="secondary"
                        size="md"
                        type="button"
                        (click)="openPaymentSheet(order, 'confirm')"
                        [disabled]="actionOrderId() === order.id || paymentSheetSubmitting()"
                      >
                        Confirmar pago
                      </app-button>
                      <app-button
                        variant="ghost"
                        size="md"
                        type="button"
                        (click)="openPaymentSheet(order, 'reject')"
                        [disabled]="actionOrderId() === order.id || paymentSheetSubmitting()"
                      >
                        Rechazar pago
                      </app-button>
                    </div>
                  }

                  @if (getActions(order.status).length) {
                    <div class="flex flex-wrap gap-3">
                      @for (action of getActions(order.status); track action.label) {
                        <app-button
                          [variant]="action.variant === 'danger' ? 'danger' : 'primary'"
                          size="md"
                          type="button"
                          (click)="updateStatus(order, action)"
                          [disabled]="actionOrderId() === order.id || paymentSheetSubmitting()"
                        >
                          @if (action.variant === 'danger') {
                            <lucide-angular class="h-4 w-4" [img]="cancelIcon" aria-hidden="true"></lucide-angular>
                          } @else if (action.status === 'Preparing') {
                            <lucide-angular class="h-4 w-4" [img]="cookingIcon" aria-hidden="true"></lucide-angular>
                          } @else {
                            <lucide-angular class="h-4 w-4" [img]="shieldIcon" aria-hidden="true"></lucide-angular>
                          }
                          {{ actionOrderId() === order.id ? 'Procesando...' : action.label }}
                        </app-button>
                      }
                    </div>
                  } @else {
                    @if (order.status === 'ReadyForPickup') {
                      <app-notice tone="info" title="Pedido listo" message="Pedido listo para recojo o asignación de delivery." />
                    } @else {
                      <app-notice tone="info" title="Sin acciones disponibles" message="Este pedido ya está fuera del tramo operativo que puede modificar el negocio." />
                    }
                  }
                </div>
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
                    {{ payment.method }}
                  </div>
                  <div class="grid gap-2 text-sm text-slate-900">
                    <p>Estado: <span class="font-bold" [class]="paymentStatusClass(payment.status)">{{ paymentStatusLabel(payment.status) }}</span></p>
                    <p>Monto: <span class="font-bold">{{ payment.amount | currency: payment.currency : 'symbol' : '1.2-2' }}</span></p>
                    @if (payment.manualReference) {
                      <p>Referencia actual: <span class="font-bold">{{ payment.manualReference }}</span></p>
                    }
                    @if (payment.failureReason) {
                      <p class="text-red-700">Motivo de rechazo: <span class="font-bold">{{ payment.failureReason }}</span></p>
                    }
                  </div>
                </div>

                <app-notice
                  tone="warning"
                  [title]="paymentSheetMode() === 'confirm' ? 'Confirma antes de registrar el pago' : 'Confirma antes de rechazar el pago'"
                  [message]="paymentSheetMode() === 'confirm'
                    ? 'Esta acción marcará el pago como pagado para este pedido.'
                    : 'Esta acción dejará el pago como rechazado para este pedido.'"
                />

                <form class="grid gap-4" [formGroup]="paymentActionForm" (ngSubmit)="submitPaymentAction()">
                  @if (paymentSheetMode() === 'confirm') {
                    <label class="grid gap-2">
                      <span class="text-sm font-semibold text-slate-900">Referencia manual opcional</span>
                      <input
                        type="text"
                        formControlName="manualReference"
                        maxlength="120"
                        placeholder="Operación, comprobante o referencia interna"
                        class="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
                      />
                    </label>
                  } @else {
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
                    <app-button type="submit" size="md" [disabled]="paymentSheetSubmitting() || paymentSheetLoading()">
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
        return status || 'Sin estado';
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
        return status;
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
          this.paymentSheetLoading.set(false);
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
