import { Component, input } from '@angular/core';

@Component({
  selector: 'app-state-card',
  standalone: true,
  template: `
    <div class="rounded-2xl border p-4" [class]="containerClass()">
      @if (title()) {
        <strong class="block text-[#3d2c22]">{{ title() }}</strong>
      }
      @if (message()) {
        <p class="mt-1">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class StateCardComponent {
  readonly title = input('');
  readonly message = input('');
  readonly containerClass = input('border-[#ddcfb4] bg-white/95 text-[#7a6658] shadow-sm');
}

