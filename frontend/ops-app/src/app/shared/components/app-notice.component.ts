import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="notice" [ngClass]="'notice-' + tone()">
      @if (title()) {
        <strong>{{ title() }}</strong>
      }
      <p>{{ message() }}</p>
    </div>
  `,
})
export class AppNoticeComponent {
  readonly tone = input<NoticeTone>('info');
  readonly title = input('');
  readonly message = input.required<string>();
}
