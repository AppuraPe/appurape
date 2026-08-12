import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  host: {
    class: 'block w-full min-w-0 max-w-full box-border',
  },
  template: `
    <div class="mb-4 flex w-full min-w-0 max-w-full flex-col gap-2.5 md:mb-5 md:flex-row md:items-start md:justify-between md:gap-4">
      @if (eyebrow()) {
        <span class="inline-flex min-h-7 w-fit items-center rounded-full bg-primary-100 px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.07em] text-primary-700 md:text-[0.72rem]">
          {{ eyebrow() }}
        </span>
      }
      <div class="grid min-w-0 max-w-full flex-1 gap-1.5">
        <h1 class="min-w-0 break-words text-balance text-[1.55rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-950 md:text-[1.9rem] lg:text-[2.15rem]">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="min-w-0 max-w-3xl break-words text-[0.92rem] leading-6 text-slate-500 md:text-base">{{ subtitle() }}</p>
        }
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly eyebrow = input<string>('');
}
