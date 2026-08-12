import { Component, input } from '@angular/core';

@Component({
  selector: 'app-internal-page-section-header',
  standalone: true,
  host: {
    class: 'block w-full min-w-0 max-w-full box-border',
  },
  template: `
    <div class="flex w-full min-w-0 max-w-full items-start justify-between gap-3 px-0.5">
      <div class="min-w-0 max-w-full flex-1">
        @if (eyebrow()) {
          <span class="inline-flex min-h-7 items-center rounded-full bg-primary-100 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-primary-700">
            {{ eyebrow() }}
          </span>
        }
        <h2 class="mt-2 min-w-0 break-words text-[1.15rem] font-extrabold leading-tight tracking-tight text-slate-950 md:text-[1.35rem]">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="mt-1 min-w-0 break-words text-sm leading-6 text-slate-500">{{ subtitle() }}</p>
        }
      </div>

      @if (meta()) {
        <span class="max-w-[45%] shrink-0 truncate rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200" [attr.title]="meta()">
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
