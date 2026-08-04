import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="mb-4 flex flex-col gap-2.5 md:mb-5 md:flex-row md:items-start md:justify-between md:gap-3">
      @if (eyebrow()) {
        <span class="inline-flex min-h-8 w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-primary-700 md:text-[0.78rem]">
          {{ eyebrow() }}
        </span>
      }
      <div class="grid gap-1.5">
        <h1 class="text-balance text-[1.7rem] font-extrabold tracking-[-0.04em] text-slate-950 md:text-[2rem]">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="max-w-3xl text-sm leading-6 text-slate-500 md:text-base">{{ subtitle() }}</p>
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
