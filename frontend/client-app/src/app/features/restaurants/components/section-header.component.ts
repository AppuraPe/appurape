import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  template: `
    <div class="mb-2 flex flex-wrap items-start justify-between gap-3 md:mb-3">
      <div>
        <h2 class="font-display text-3xl text-[#3d2c22]">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="text-[#7a6658]">{{ subtitle() }}</p>
        }
      </div>
      @if (badge()) {
        <span class="inline-flex rounded-full px-3 py-1 text-xs font-black" [class]="badgeClass()">{{ badge() }}</span>
      }
    </div>
  `,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly badge = input('');
  readonly badgeClass = input('bg-[#f6efdf] text-[#3d2c22]');
}

