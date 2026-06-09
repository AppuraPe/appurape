import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="grid gap-1 rounded-[22px] border px-4 py-3 shadow-soft" [ngClass]="toneClass()">
      @if (title()) {
        <strong class="text-sm font-extrabold text-loreto-carbon">{{ title() }}</strong>
      }
      <p class="text-sm leading-6 text-loreto-carbon/80">{{ message() }}</p>
    </div>
  `,
})
export class AppNoticeComponent {
  readonly tone = input<NoticeTone>('info');
  readonly title = input('');
  readonly message = input.required<string>();

  toneClass(): string {
    switch (this.tone()) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  }
}
