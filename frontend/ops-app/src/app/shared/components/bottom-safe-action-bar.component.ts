import { Component, computed, input } from '@angular/core';

type ActionBarMode = 'sticky' | 'fixed' | 'static';

@Component({
  selector: 'app-bottom-safe-action-bar',
  standalone: true,
  host: {
    class: 'block w-full',
  },
  template: `
    <div [class]="containerClass()">
      <div class="mx-auto w-full max-w-[1200px]">
        <div class="rounded-[18px] border border-slate-200 bg-white/95 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class BottomSafeActionBarComponent {
  readonly mode = input<ActionBarMode>('sticky');
  readonly extraClass = input('');

  readonly containerClass = computed(() => {
    const modeClass = (() => {
      switch (this.mode()) {
        case 'fixed':
          return 'fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-[70] px-4 pb-2 xl:bottom-0 xl:pb-[calc(18px+env(safe-area-inset-bottom,0px))]';
        case 'static':
          return 'px-4 pb-[calc(18px+env(safe-area-inset-bottom,0px))]';
        default:
          return 'sticky bottom-0 z-30 px-4 pb-[calc(18px+env(safe-area-inset-bottom,0px))]';
      }
    })();

    return [modeClass, this.extraClass()].filter(Boolean).join(' ');
  });
}
