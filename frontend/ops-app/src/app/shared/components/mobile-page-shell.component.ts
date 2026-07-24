import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-mobile-page-shell',
  standalone: true,
  imports: [NgClass],
  host: {
    class: 'block w-full',
  },
  template: `
    <section [ngClass]="shellClass()">
      <ng-content />
    </section>
  `,
})
export class MobilePageShellComponent {
  readonly extraClass = input('');
  readonly backgroundClass = input('bg-slate-50');
  readonly topSafeArea = input(true);
  readonly bottomSpacingClass = input('pb-[calc(76px+env(safe-area-inset-bottom,0px))]');
  readonly desktopClass = input(
    'lg:mx-auto lg:max-w-[1200px] lg:space-y-[10px] lg:bg-transparent lg:px-0 lg:pb-16 lg:pt-0',
  );

  readonly shellClass = computed(() =>
    [
      'min-h-dvh w-full overflow-x-hidden',
      this.backgroundClass(),
      this.topSafeArea() ? 'pt-[env(safe-area-inset-top,0px)]' : '',
      this.bottomSpacingClass(),
      this.desktopClass(),
      this.extraClass(),
    ]
      .filter(Boolean)
      .join(' '),
  );
}
