import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerOrderListItemResponse } from '../../../core/models/orders.models';

@Component({
  selector: 'app-order-summary-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <article class="group min-w-0 rounded-[24px] border border-[#ead8d2] bg-white p-4 shadow-[0_8px_20px_rgba(6,25,43,0.06)] transition duration-200 sm:p-5">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em]"
            [class]="statusTone()"
          >
            {{ statusLabel() }}
          </span>
          <h3 class="mt-3 line-clamp-2 text-balance font-display text-[1.3rem] leading-tight tracking-[-0.03em] text-loreto-carbon sm:text-[1.45rem]">{{ order().restaurantName }}</h3>
          <p class="mt-1 text-xs text-loreto-cecina/80">Pedido {{ orderIdShort() }}</p>
        </div>
        <div class="min-w-0 text-right">
          <p class="text-lg font-black leading-none text-primary-700 sm:text-xl">
            {{ order().total | currency: 'PEN' : 'symbol' : '1.2-2' }}
          </p>
          <p class="mt-2 text-xs text-loreto-cecina/80">{{ order().createdAtUtc | date: 'short' }}</p>
        </div>
      </div>

      @if (showMeta()) {
        <div class="grid gap-2 sm:grid-cols-3">
          <div class="rounded-2xl bg-surface-soft p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-loreto-cecina">Subtotal</p>
            <p class="mt-1 text-sm font-semibold text-loreto-carbon">
              {{ order().subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </p>
          </div>
          <div class="rounded-2xl bg-surface-soft p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-loreto-cecina">Delivery</p>
            <p class="mt-1 text-sm font-semibold text-loreto-carbon">
              {{ order().deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </p>
          </div>
          <div class="rounded-2xl bg-surface-soft p-3">
            <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-loreto-cecina">Pago</p>
            <p class="mt-1 line-clamp-1 text-sm font-semibold text-loreto-carbon">{{ order().paymentMethod }}</p>
          </div>
        </div>
      }

      <a
        class="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary-700 px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(229,27,35,0.16)] transition duration-200 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/30"
        [routerLink]="[actionRoute(), order().id]"
      >
        Ver detalle
      </a>
    </article>
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

  statusTone(): string {
    const status = this.order().status;
    const classes: Record<string, string> = {
      Pending: 'bg-accent-500/15 text-accent-600',
      Accepted: 'bg-loreto-rio/15 text-loreto-rio',
      Preparing: 'bg-loreto-rio/15 text-loreto-rio',
      ReadyForPickup: 'bg-loreto-hoja/20 text-loreto-verde',
      Assigned: 'bg-loreto-rio/15 text-loreto-rio',
      PickedUp: 'bg-loreto-rio/15 text-loreto-rio',
      Delivered: 'bg-loreto-hoja/20 text-loreto-verde',
      Cancelled: 'bg-primary-100 text-primary-700',
    };

    return classes[status] ?? 'bg-primary-50 text-loreto-carbon';
  }

  orderIdShort(): string {
    return this.order().id.slice(0, 8).toUpperCase();
  }
}
