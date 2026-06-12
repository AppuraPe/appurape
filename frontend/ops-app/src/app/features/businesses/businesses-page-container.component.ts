import { Component } from '@angular/core';

@Component({
  selector: 'app-businesses-page-container',
  standalone: true,
  template: `
    <section class="mx-auto w-full max-w-[1200px] space-y-4 px-3 pb-[calc(82px+env(safe-area-inset-bottom,0px))] sm:px-6 lg:w-[calc(100%-48px)] lg:space-y-[10px] lg:px-0 lg:pb-16">
      <ng-content />
    </section>
  `,
})
export class BusinessesPageContainerComponent {}

