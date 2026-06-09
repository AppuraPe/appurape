import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em]"
      [ngClass]="toneClass()"
    >
      @if (prefix()) {
        <span class="opacity-70">{{ prefix() }}</span>
      }
      {{ label() || status() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string | boolean | null | undefined>();
  readonly label = input<string>('');
  readonly prefix = input<string>('');

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
        return 'border-[#eddad4] bg-surface-soft text-loreto-carbon';
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

    if (['approved', 'active', 'available', 'delivered', 'trusted', 'topcollaborator'].includes(normalized)) {
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
}
