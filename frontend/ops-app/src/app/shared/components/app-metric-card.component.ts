import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  host: {
    class: 'block w-full min-w-0 max-w-full box-border',
  },
  template: `
    <div class="box-border grid min-h-[92px] w-full min-w-0 max-w-full gap-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all duration-300 ease-out md:hover:-translate-y-0.5 md:hover:bg-primary-50 md:hover:shadow-[0_14px_26px_rgba(15,23,42,0.08)] sm:rounded-[20px] sm:px-4 sm:py-3.5">
      <span class="truncate text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-text-muted sm:text-[0.7rem]">{{ label() }}</span>
      <strong class="min-w-0 break-words text-[1.35rem] font-black leading-tight tracking-[-0.035em] text-loreto-carbon sm:text-[1.55rem]">{{ value() }}</strong>
      @if (helper()) {
        <span class="min-w-0 break-words text-[0.78rem] leading-5 text-text-muted sm:text-[0.82rem]">{{ helper() }}</span>
      }
    </div>
  `,
})
export class AppMetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly helper = input<string>('');
}
