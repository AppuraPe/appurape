import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  template: `
    <div class="mb-3 flex flex-wrap items-end justify-between gap-3 md:mb-4">
      <div class="grid min-w-0 gap-1.5">
        <h2 class="text-balance font-display text-[1.45rem] font-black tracking-[-0.04em] text-loreto-carbon md:text-[1.9rem]">
          {{ title() }}
        </h2>
        @if (subtitle()) {
          <p class="max-w-3xl text-sm leading-5.5 text-text-muted md:text-base">{{ subtitle() }}</p>
        }
      </div>
      @if (badge()) {
        <span class="inline-flex shrink-0 rounded-full px-3 py-1.5 text-[0.64rem] font-black uppercase tracking-[0.14em]" [class]="badgeClass()">
          {{ badge() }}
        </span>
      }
    </div>
  `,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly badge = input('');
  readonly badgeClass = input('bg-primary-100 text-primary-700');
}
