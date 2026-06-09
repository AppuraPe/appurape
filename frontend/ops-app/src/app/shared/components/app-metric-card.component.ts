import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  template: `
    <div class="grid gap-1 rounded-[22px] border border-[#eddad4] bg-surface-soft p-4 shadow-[0_12px_28px_rgba(6,25,43,0.08)] transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_34px_rgba(6,25,43,0.12)]">
      <span class="text-xs font-extrabold uppercase tracking-[0.18em] text-text-muted">{{ label() }}</span>
      <strong class="text-2xl font-black tracking-[-0.04em] text-loreto-carbon">{{ value() }}</strong>
      @if (helper()) {
        <span class="text-sm text-text-muted">{{ helper() }}</span>
      }
    </div>
  `,
})
export class AppMetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly helper = input<string>('');
}
