import { Component } from '@angular/core';

@Component({
  selector: 'app-businesses-page-container',
  standalone: true,
  template: `
    <section class="min-h-dvh w-full overflow-x-hidden bg-slate-50 pb-[calc(76px+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top,0px)] lg:mx-auto lg:max-w-[1200px] lg:space-y-[10px] lg:bg-transparent lg:px-0 lg:pb-16 lg:pt-0">
      <ng-content />
    </section>
  `,
})
export class BusinessesPageContainerComponent {}

