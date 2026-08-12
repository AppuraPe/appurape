import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  host: {
    class: 'inline-flex min-w-0 max-w-full box-border',
  },
  template: `
    <span
      class="inline-flex min-h-8 min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]"
      [ngClass]="toneClass()"
      [attr.title]="displayLabel()"
    >
      @if (prefix()) {
        <span class="shrink-0 opacity-70">{{ prefix() }}</span>
      }
      <span class="min-w-0 truncate">{{ displayLabel() }}</span>
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string | boolean | null | undefined>();
  readonly label = input<string>('');
  readonly prefix = input<string>('');

  readonly displayLabel = computed(() => this.label() || this.resolveLabel(this.status()));

  readonly toneClass = computed(() => {
    switch (this.resolveTone(this.status())) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'danger':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'muted':
        return 'border-slate-200 bg-slate-100 text-slate-600';
      default:
        return 'border-slate-200 bg-white text-slate-700';
    }
  });

  private resolveTone(status: string | boolean | null | undefined): BadgeTone {
    if (status === true) {
      return 'success';
    }

    if (status === false) {
      return 'muted';
    }

    const normalized = String(status ?? '').toLowerCase().replace(/\s+/g, '');

    if (['approved', 'active', 'available', 'delivered', 'paid', 'completed', 'confirmed', 'connected', 'trusted', 'topcollaborator'].includes(normalized)) {
      return 'success';
    }

    if (['verified', 'pending', 'accepted', 'preparing', 'readyforpickup', 'assigned', 'pickedup', 'ontheway', 'published', 'searching', 'inprocess', 'busy'].includes(normalized)) {
      return 'warning';
    }

    if (['rejected', 'suspended', 'inactive', 'notavailable', 'cancelled', 'disconnected'].includes(normalized)) {
      return 'danger';
    }

    if (['restaurant', 'driver', 'admin', 'marketpurchase', 'errand', 'productpickup', 'packagedelivery', 'compensatedfavor'].includes(normalized)) {
      return 'info';
    }

    return 'neutral';
  }

  private resolveLabel(status: string | boolean | null | undefined): string {
    if (status === true) {
      return 'Activo';
    }

    if (status === false) {
      return 'Inactivo';
    }

    switch (String(status ?? '')) {
      case 'Pending':
        return 'Pendiente';
      case 'PendingConfirmation':
        return 'Pendiente de confirmación';
      case 'Accepted':
        return 'Aceptado';
      case 'Preparing':
        return 'En preparación';
      case 'ReadyForPickup':
        return 'Listo para recoger';
      case 'Assigned':
        return 'Asignado';
      case 'PickedUp':
        return 'Recogido';
      case 'OnTheWay':
        return 'En camino';
      case 'Delivered':
        return 'Entregado';
      case 'Cancelled':
        return 'Cancelado';
      case 'Paid':
        return 'Pagado';
      case 'Rejected':
        return 'Rechazado';
      case 'Failed':
        return 'Fallido';
      case 'Refunded':
        return 'Reembolsado';
      case 'Approved':
        return 'Aprobado';
      case 'Active':
        return 'Activo';
      case 'Inactive':
        return 'Inactivo';
      case 'Suspended':
        return 'Suspendido';
      case 'Available':
        return 'Disponible';
      case 'NotAvailable':
        return 'No disponible';
      case 'Busy':
        return 'Ocupado';
      case 'Published':
        return 'Publicado';
      case 'Searching':
        return 'Buscando';
      case 'InProgress':
      case 'InProcess':
        return 'En proceso';
      case 'Confirmed':
        return 'Confirmado';
      case 'Completed':
        return 'Completado';
      case 'Connected':
        return 'Conectado';
      case 'Disconnected':
        return 'Desconectado';
      case 'Open':
        return 'Abierto';
      case 'Closed':
        return 'Cerrado';
      case 'Applied':
        return 'Postulación enviada';
      case 'Selected':
        return 'Seleccionado';
      case 'TopCollaborator':
        return 'Colaborador destacado';
      case 'MarketPurchase':
        return 'Compra';
      case 'Errand':
        return 'Mandado';
      case 'ProductPickup':
        return 'Recojo';
      case 'PackageDelivery':
        return 'Entrega';
      case 'CompensatedFavor':
        return 'Favor';
      default:
        return String(status ?? 'Sin estado') || 'Sin estado';
    }
  }
}
