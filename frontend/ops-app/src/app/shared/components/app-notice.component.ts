import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [NgClass],
  host: {
    class: 'block w-full min-w-0 max-w-full box-border',
  },
  template: `
    <div class="box-border grid w-full min-w-0 max-w-full gap-1 overflow-hidden rounded-[18px] border px-3.5 py-3 shadow-sm sm:rounded-[22px] sm:px-4" [ngClass]="toneClass()">
      @if (title()) {
        <strong class="min-w-0 break-words text-sm font-extrabold text-slate-950">{{ title() }}</strong>
      }
      <p class="min-w-0 break-words text-sm leading-6 text-slate-600">{{ message() }}</p>
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
        return 'border-emerald-200 bg-emerald-50/80';
      case 'warning':
        return 'border-amber-200 bg-amber-50/80';
      case 'danger':
        return 'border-red-200 bg-red-50/80';
      default:
        return 'border-slate-200 bg-slate-50';
    }
  }
}
