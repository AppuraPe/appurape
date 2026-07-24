import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="grid gap-1 rounded-[22px] border px-4 py-3 shadow-sm" [ngClass]="toneClass()">
      @if (title()) {
        <strong class="text-sm font-extrabold text-slate-950">{{ title() }}</strong>
      }
      <p class="text-sm leading-6 text-slate-600">{{ message() }}</p>
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
