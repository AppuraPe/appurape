import { Component } from '@angular/core';

@Component({
  selector: 'app-businesses-page-container',
  standalone: true,
  template: `
    <section class="mx-auto w-full max-w-[1240px] space-y-6 px-4 pb-20 sm:px-6 lg:space-y-8 lg:px-8 lg:pb-16">
      <ng-content />
    </section>
  `,
})
export class BusinessesPageContainerComponent {}

