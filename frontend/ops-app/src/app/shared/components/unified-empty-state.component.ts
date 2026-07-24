import { Component, input } from '@angular/core';

@Component({
  selector: 'app-unified-empty-state',
  standalone: true,
  host: {
    class: 'block w-full',
  },
  template: `
    <div class="rounded-[24px] border border-dashed border-slate-200 bg-white px-5 py-6 text-center shadow-sm">
      @if (eyebrow()) {
        <span class="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {{ eyebrow() }}
        </span>
      }
      <h3 class="mt-3 text-lg font-extrabold tracking-tight text-slate-950">{{ title() }}</h3>
      <p class="mt-2 text-sm leading-6 text-slate-500">{{ message() }}</p>
      <div class="mt-4">
        <ng-content />
      </div>
    </div>
  `,
})
export class UnifiedEmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly eyebrow = input('');
}
