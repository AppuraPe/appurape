import { Component, input } from '@angular/core';

@Component({
  selector: 'app-internal-page-section-header',
  standalone: true,
  host: {
    class: 'block w-full',
  },
  template: `
    <div class="flex w-full min-w-0 items-start justify-between gap-3 px-1">
      <div class="min-w-0 flex-1">
        @if (eyebrow()) {
          <span class="inline-flex min-h-8 items-center rounded-full bg-primary-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary-700">
            {{ eyebrow() }}
          </span>
        }
        <h2 class="mt-2 text-xl font-extrabold tracking-tight text-slate-950 md:text-2xl">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="mt-1 text-sm leading-6 text-slate-500 md:text-[15px]">{{ subtitle() }}</p>
        }
      </div>

      @if (meta()) {
        <span class="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
          {{ meta() }}
        </span>
      }
    </div>
  `,
})
export class InternalPageSectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly eyebrow = input('');
  readonly meta = input('');
}
