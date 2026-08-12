import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerOrderListItemResponse } from '../../../core/models/orders.models';
import { AppButtonComponent } from '../../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';

@Component({
  selector: 'app-order-summary-card',
  standalone: true,
  host: {
    class: 'block w-full min-w-0 max-w-full box-border',
  },
  imports: [RouterLink, CurrencyPipe, DatePipe, AppSurfaceCardComponent, StatusBadgeComponent, AppButtonComponent],
  template: `
    <app-surface-card extraClass="group min-w-0 p-4">
      <div class="flex min-w-0 items-start justify-between gap-2.5">
        <div class="min-w-0">
          <h3 class="truncate text-base font-extrabold leading-tight text-slate-950" [title]="order().restaurantName">
            {{ order().restaurantName }}
          </h3>
          <p class="mt-1 truncate text-xs text-slate-500">
            Pedido #{{ orderIdShort() }} · {{ order().createdAtUtc | date: 'short' }}
          </p>
        </div>
        <app-status-badge class="shrink-0" [status]="order().status" [label]="statusLabel()" />
      </div>

      <div class="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-slate-100 pt-3">
        <div class="min-w-0 space-y-1">
          <p class="truncate text-xs text-slate-500">
            Entrega: <span class="font-semibold text-slate-700">{{ deliveryModeLabel() }}</span>
          </p>
          <p class="truncate text-xs text-slate-500">
            Pago: <span class="font-semibold text-slate-700">{{ paymentSummaryLabel() }}</span>
          </p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.08em] text-slate-500">Total</p>
          <p class="mt-0.5 whitespace-nowrap text-base font-black text-primary-700">
            {{ order().total | currency: 'PEN' : 'S/ ' : '1.2-2' }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex justify-end">
        <app-button size="sm" variant="secondary" [routerLink]="[actionRoute(), order().id]">Ver detalle</app-button>
      </div>
    </app-surface-card>
  `,
})
export class OrderSummaryCardComponent {
  readonly order = input.required<CustomerOrderListItemResponse>();
  readonly actionRoute = input('/orders');

  statusLabel(): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Accepted: 'Aceptado',
      Preparing: 'En preparación',
      ReadyForPickup: 'Listo para recoger',
      Assigned: 'Repartidor asignado',
      PickedUp: 'En camino',
      OnTheWay: 'En camino',
      Delivered: 'Entregado',
      Cancelled: 'Cancelado',
      PaymentPending: 'Pago pendiente',
      PendingConfirmation: 'Pago en revisión',
    };

    return labels[this.order().status] ?? 'En proceso';
  }

  paymentMethodLabel(): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[this.order().paymentMethod] ?? 'Registrado';
  }

  paymentStatusLabel(): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      PaymentPending: 'Pendiente',
      PendingConfirmation: 'En revisión',
      Paid: 'Pagado',
      Rejected: 'Rechazado',
      Failed: 'Fallido',
      Refunded: 'Reembolsado',
    };

    return labels[this.order().paymentStatus] ?? 'Registrado';
  }

  deliveryModeLabel(): string {
    const labels: Record<string, string> = {
      PickupOrDirect: 'Recojo o entrega directa',
      BusinessDelivery: 'Entrega del negocio',
      VerifiedDriverDelivery: 'Driver verificado',
    };

    return labels[this.order().deliveryMode] ?? 'Entrega coordinada';
  }

  paymentSummaryLabel(): string {
    return `${this.paymentMethodLabel()} · ${this.paymentStatusLabel()}`;
  }

  orderIdShort(): string {
    return this.order().id.slice(0, 8).toUpperCase();
  }
}
