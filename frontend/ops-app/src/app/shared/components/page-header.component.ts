import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="mb-4 flex flex-col gap-2.5 md:mb-5 md:flex-row md:items-start md:justify-between md:gap-3">
      @if (eyebrow()) {
        <span class="inline-flex w-fit items-center rounded-full bg-primary-100 px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.08em] text-primary-700 md:px-3 md:text-[0.78rem]">
          {{ eyebrow() }}
        </span>
      }
      <div class="grid gap-1.5">
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="max-w-3xl text-sm leading-5 text-text-muted md:text-base md:leading-6">{{ subtitle() }}</p>
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
