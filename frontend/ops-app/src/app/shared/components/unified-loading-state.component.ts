import { Component, input } from '@angular/core';

@Component({
  selector: 'app-unified-loading-state',
  standalone: true,
  host: {
    class: 'block w-full',
  },
  template: `
    <div class="rounded-[24px] border border-slate-200 bg-white px-5 py-6 shadow-sm">
      <span class="inline-flex min-h-8 items-center rounded-full bg-red-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-red-500">
        {{ label() }}
      </span>
      <div class="mt-4 h-3 w-2/5 animate-pulse rounded-full bg-slate-200"></div>
      <div class="mt-3 h-3 w-3/5 animate-pulse rounded-full bg-slate-200"></div>
      <div class="mt-3 h-3 w-full animate-pulse rounded-full bg-slate-200"></div>
    </div>
  `,
})
export class UnifiedLoadingStateComponent {
  readonly label = input('Cargando');
}
