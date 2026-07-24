import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerOrderListItemResponse } from '../../../core/models/orders.models';
import { AppButtonComponent } from '../../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';

@Component({
  selector: 'app-order-summary-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, AppSurfaceCardComponent, StatusBadgeComponent, AppNoticeComponent, AppButtonComponent],
  template: `
    <app-surface-card variant="page" extraClass="group min-w-0 p-4 sm:p-5">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <app-status-badge [status]="order().status" [label]="statusLabel()" />
          <h3 class="mt-3 line-clamp-2 text-balance text-[1.3rem] font-extrabold leading-tight tracking-[-0.03em] text-slate-950 sm:text-[1.45rem]">
            {{ order().restaurantName }}
          </h3>
          <p class="mt-1 text-xs text-slate-500">Pedido {{ orderIdShort() }}</p>
        </div>
        <div class="min-w-0 text-right">
          <p class="text-lg font-black leading-none text-primary-700 sm:text-xl">
            {{ order().total | currency: 'PEN' : 'symbol' : '1.2-2' }}
          </p>
          <p class="mt-2 text-xs text-slate-500">{{ order().createdAtUtc | date: 'short' }}</p>
        </div>
      </div>

      @if (showMeta()) {
        <div class="grid gap-2 sm:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Subtotal</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ order().subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Delivery</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ order().deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Pago</p>
            <p class="mt-1 line-clamp-1 text-sm font-semibold text-slate-900">{{ paymentMethodLabel() }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Estado de pago</p>
            <div class="mt-1">
              <app-status-badge [status]="order().paymentStatus" [label]="paymentStatusLabel()" />
            </div>
          </div>
        </div>

        @if (showManualPaymentNotice()) {
          <app-notice class="mt-3" tone="warning" message="El negocio aún debe confirmar tu pago." />
        }

        @if (order().paymentStatus === 'Rejected' && order().paymentFailureReason) {
          <app-notice class="mt-3" tone="danger" [message]="'Motivo: ' + order().paymentFailureReason" />
        }
      }

      <app-button class="mt-4" [routerLink]="[actionRoute(), order().id]" block>
        Ver detalle
      </app-button>
    </app-surface-card>
  `,
})
export class OrderSummaryCardComponent {
  readonly order = input.required<CustomerOrderListItemResponse>();
  readonly showMeta = input(true);
  readonly actionRoute = input('/orders');

  statusLabel(): string {
    const status = this.order().status;
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Accepted: 'Aceptado',
      Preparing: 'En preparación',
      ReadyForPickup: 'Listo',
      Assigned: 'Asignado',
      PickedUp: 'En camino',
      Delivered: 'Entregado',
      Cancelled: 'Cancelado',
    };

    return labels[status] ?? status;
  }

  paymentMethodLabel(): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[this.order().paymentMethod] ?? this.order().paymentMethod;
  }

  paymentStatusLabel(): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      PendingConfirmation: 'Pendiente de confirmación',
      Paid: 'Pagado',
      Rejected: 'Rechazado',
      Failed: 'Fallido',
      Refunded: 'Reembolsado',
    };

    return labels[this.order().paymentStatus] ?? this.order().paymentStatus;
  }

  showManualPaymentNotice(): boolean {
    return ['Yape', 'Plin'].includes(this.order().paymentMethod) && this.order().paymentStatus === 'PendingConfirmation';
  }

  orderIdShort(): string {
    return this.order().id.slice(0, 8).toUpperCase();
  }
}
