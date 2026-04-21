import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="toneClass()">
      @if (prefix()) {
        <span class="badge-prefix">{{ prefix() }}</span>
      }
      {{ label() || status() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string | boolean | null | undefined>();
  readonly label = input<string>('');
  readonly prefix = input<string>('');

  readonly toneClass = computed(() => `badge-${this.resolveTone(this.status())}`);

  private resolveTone(status: string | boolean | null | undefined): BadgeTone {
    if (status === true) {
      return 'success';
    }

    if (status === false) {
      return 'muted';
    }

    const normalized = String(status ?? '').toLowerCase().replace(/\s+/g, '');

    if (['approved', 'active', 'available', 'delivered'].includes(normalized)) {
      return 'success';
    }

    if (['pending', 'accepted', 'preparing', 'readyforpickup', 'assigned', 'pickedup', 'ontheway'].includes(normalized)) {
      return 'warning';
    }

    if (['rejected', 'suspended', 'inactive', 'notavailable', 'cancelled'].includes(normalized)) {
      return 'danger';
    }

    if (['restaurant', 'driver', 'admin'].includes(normalized)) {
      return 'info';
    }

    return 'neutral';
  }
}
