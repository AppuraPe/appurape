import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CalendarClock, CircleCheckBig, CircleX, CreditCard, LucideAngularModule, Phone, ReceiptText, Store, UserRound, Wallet } from 'lucide-angular';
import { AdminPaymentDetail } from '../../core/models/admin-payments.models';
import { AdminPaymentsApiService } from '../../core/services/admin-payments-api.service';
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

type PaymentAction = 'confirm' | 'reject';

@Component({
  selector: 'app-admin-payment-detail-page',
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
        <app-back-button fallbackUrl="/admin/payments" label="Volver a pagos" />
      </div>

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando detalle del pago" />
          <app-unified-loading-state label="Preparando revisión" />
        </div>
      } @else if (errorMessage() && !payment()) {
        <app-unified-empty-state title="No encontramos el pago" message="Intenta nuevamente para revisar este pago manual.">
          <app-button type="button" variant="secondary" (click)="loadPayment()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (payment(); as payment) {
        <app-surface-card variant="page" extraClass="p-5">
          <app-internal-page-section-header
            eyebrow="Admin"
            title="Detalle del pago"
            subtitle="Confirma o rechaza el pago manual antes de habilitar el flujo del negocio."
            [meta]="'Pedido ' + payment.orderCode"
          />

          @if (errorMessage()) {
            <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
          }

          <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <app-surface-card variant="soft" extraClass="grid gap-4 p-4">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="walletIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="grid gap-1">
                  <strong class="text-xl font-extrabold tracking-[-0.03em] text-slate-950">Pedido {{ payment.orderCode }}</strong>
                  <span class="text-sm text-slate-500">{{ payment.createdAtUtc | date: 'medium' }}</span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <app-status-badge [status]="payment.orderStatus" prefix="Pedido" />
                <app-status-badge [status]="payment.paymentStatus" [label]="paymentStatusLabel(payment.paymentStatus)" prefix="Pago" />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="userIcon" aria-hidden="true"></lucide-angular>
                    Cliente
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ payment.customerName }}</p>
                  @if (payment.customerPhone) {
                    <p class="mt-1 inline-flex min-h-11 items-center gap-2 text-sm text-slate-500">
                      <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                      {{ payment.customerPhone }}
                    </p>
                  }
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                    Negocio
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ payment.businessName }}</p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="creditCardIcon" aria-hidden="true"></lucide-angular>
                    Pago
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">{{ payment.paymentMethod }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ paymentStatusLabel(payment.paymentStatus) }}</p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                    Estado del pedido
                  </div>
                  <div class="mt-2">
                    <app-status-badge [status]="payment.orderStatus" />
                  </div>
                </div>
              </div>

              @if (payment.paymentReference) {
                <app-notice tone="info" title="Referencia de pago" [message]="payment.paymentReference" />
              }

              @if (payment.paymentProofUrl) {
                <app-notice tone="info" title="Comprobante" message="Este pago tiene un comprobante asociado." />
              }
            </app-surface-card>

            <app-surface-card variant="page" extraClass="grid gap-4 p-4">
              <div class="flex items-center gap-2">
                <lucide-angular class="h-5 w-5 text-primary-700" [img]="receiptIcon" aria-hidden="true"></lucide-angular>
                <h2 class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Resumen del pedido</h2>
              </div>

              <div class="grid gap-3">
                @for (item of payment.items; track item.productName + '-' + item.unitPrice) {
                  <div class="grid gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-950">{{ item.productName }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ item.quantity }} x {{ item.unitPrice | currency: 'PEN' : 'symbol' : '1.2-2' }}</p>
                    </div>
                    <strong class="text-sm text-slate-950">{{ item.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                }
              </div>

              <div class="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-500">Subtotal</span>
                  <strong class="text-slate-950">{{ payment.subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-500">Delivery</span>
                  <strong class="text-slate-950">{{ payment.deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                  <span class="font-bold text-slate-950">Total</span>
                  <strong class="text-base font-black text-slate-950">{{ payment.total | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                </div>
              </div>
            </app-surface-card>
          </div>
        </app-surface-card>

        @if (canReviewPayment()) {
          <app-bottom-safe-action-bar mode="fixed">
            <div class="flex flex-wrap gap-3">
              <app-button type="button" size="md" [disabled]="isSubmitting()" (click)="openConfirmation('confirm')">
                Confirmar pago
              </app-button>
              <app-button type="button" variant="danger" size="md" [disabled]="isSubmitting()" (click)="openConfirmation('reject')">
                Rechazar pago
              </app-button>
            </div>
          </app-bottom-safe-action-bar>
        }
      }

      @if (confirmationAction(); as action) {
        <div class="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" (click)="closeConfirmation()"></div>
        <div class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-3 pb-3 sm:inset-0 sm:grid sm:place-items-center sm:px-6 sm:py-8">
          <section
            class="w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(6,25,43,0.24)]"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {{ action === 'confirm' ? '¿Confirmar este pago?' : '¿Rechazar este pago?' }}
            </h2>
            <p class="mt-2 text-sm text-slate-500">
              {{ action === 'confirm'
                ? 'El pedido quedará con pago confirmado y el negocio podrá continuar el flujo operativo.'
                : 'El pedido quedará con pago rechazado y el negocio no podrá avanzar.' }}
            </p>

            <div class="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <app-button type="button" variant="ghost" size="md" (click)="closeConfirmation()" [disabled]="isSubmitting()">
                Cancelar
              </app-button>
              <app-button
                type="button"
                [variant]="action === 'confirm' ? 'primary' : 'danger'"
                size="md"
                (click)="submitAction(action)"
                [disabled]="isSubmitting()"
              >
                {{ isSubmitting() ? 'Procesando...' : action === 'confirm' ? 'Confirmar pago' : 'Rechazar pago' }}
              </app-button>
            </div>
          </section>
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class AdminPaymentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminPaymentsApi = inject(AdminPaymentsApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly walletIcon = Wallet;
  readonly creditCardIcon = CreditCard;
  readonly receiptIcon = ReceiptText;
  readonly phoneIcon = Phone;
  readonly storeIcon = Store;
  readonly userIcon = UserRound;
  readonly calendarIcon = CalendarClock;
  readonly confirmIcon = CircleCheckBig;
  readonly rejectIcon = CircleX;

  readonly payment = signal<AdminPaymentDetail | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly confirmationAction = signal<PaymentAction | null>(null);
  readonly canReviewPayment = computed(() => this.payment()?.paymentStatus === 'PendingConfirmation');

  private readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';

  constructor() {
    this.loadPayment();
  }

  loadPayment(): void {
    if (!this.orderId) {
      this.errorMessage.set('No encontramos el pago solicitado.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminPaymentsApi
      .getPaymentDetail(this.orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) => {
          this.payment.set(payment);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el detalle del pago.'));
          this.isLoading.set(false);
        },
      });
  }

  openConfirmation(action: PaymentAction): void {
    this.confirmationAction.set(action);
  }

  closeConfirmation(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.confirmationAction.set(null);
  }

  submitAction(action: PaymentAction): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const request$ = action === 'confirm'
      ? this.adminPaymentsApi.confirmPayment(this.orderId)
      : this.adminPaymentsApi.rejectPayment(this.orderId);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.isSubmitting.set(false);
        this.confirmationAction.set(null);
        this.notificationService[action === 'confirm' ? 'success' : 'warning'](
          action === 'confirm' ? 'Pago confirmado correctamente.' : 'Pago rechazado.',
        );
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.confirmationAction.set(null);
        this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el pago. Intenta nuevamente.'));

        if (error?.status === 403) {
          this.notificationService.error('No tienes permisos para gestionar pagos.');
          return;
        }

        this.notificationService.error('No se pudo actualizar el pago. Intenta nuevamente.');
      },
    });
  }

  paymentStatusLabel(status: string): string {
    switch (status) {
      case 'PendingConfirmation':
        return 'Pendiente de confirmación';
      case 'Paid':
        return 'Pagado';
      case 'Rejected':
        return 'Pago rechazado';
      default:
        return status;
    }
  }

  paymentStatusClass(status: string): string {
    switch (status) {
      case 'PendingConfirmation':
        return 'bg-amber-100 text-amber-800';
      case 'Paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}
