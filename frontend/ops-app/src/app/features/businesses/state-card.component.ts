import { Component, input } from '@angular/core';

@Component({
  selector: 'app-state-card',
  standalone: true,
  template: `
    <div class="rounded-[22px] border p-5 shadow-[0_8px_20px_rgba(6,25,43,0.06)] md:p-6" [class]="containerClass()">
      @if (title()) {
        <strong class="block text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ title() }}</strong>
      }
      @if (message()) {
        <p class="mt-2 text-sm leading-6 md:text-base">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class StateCardComponent {
  readonly title = input('');
  readonly message = input('');
  readonly containerClass = input('border-[#ead8d2] bg-white/95 text-text-muted');
}
