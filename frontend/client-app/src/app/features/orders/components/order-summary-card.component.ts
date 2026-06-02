import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerOrderListItemResponse } from '../../../core/models/orders.models';

@Component({
  selector: 'app-order-summary-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <article class="group rounded-3xl border border-primary-100 bg-surface-card p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-loreto">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <span
            class="inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
            [class]="statusTone()"
          >
            {{ statusLabel() }}
          </span>
          <h3 class="mt-3 font-display text-3xl leading-none text-loreto-carbon">{{ order().restaurantName }}</h3>
          <p class="mt-2 text-xs text-loreto-cecina/80">Pedido {{ orderIdShort() }}</p>
        </div>
        <div class="text-right">
          <p class="font-display text-3xl leading-none text-primary-700">
            {{ order().total | currency: 'PEN' : 'symbol' : '1.2-2' }}
          </p>
          <p class="mt-2 text-xs text-loreto-cecina/80">{{ order().createdAtUtc | date: 'medium' }}</p>
        </div>
      </div>

      @if (showMeta()) {
        <div class="grid gap-2 sm:grid-cols-3">
          <div class="rounded-2xl bg-surface-soft p-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-loreto-cecina">Subtotal</p>
            <p class="mt-1 font-ui text-sm font-semibold text-loreto-carbon">
              {{ order().subtotal | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </p>
          </div>
          <div class="rounded-2xl bg-surface-soft p-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-loreto-cecina">Delivery</p>
            <p class="mt-1 font-ui text-sm font-semibold text-loreto-carbon">
              {{ order().deliveryFee | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </p>
          </div>
          <div class="rounded-2xl bg-surface-soft p-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-loreto-cecina">Pago</p>
            <p class="mt-1 font-ui text-sm font-semibold text-loreto-carbon">{{ order().paymentMethod }}</p>
          </div>
        </div>
      }

      <a
        class="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary-600 px-4 py-3 font-ui text-sm font-semibold text-white transition duration-200 hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/40"
        [routerLink]="[actionRoute(), order().id]"
      >
        Ver seguimiento y detalle
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
      Preparing: 'En preparacion',
      ReadyForPickup: 'Listo para recoger',
      Assigned: 'Repartidor asignado',
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

