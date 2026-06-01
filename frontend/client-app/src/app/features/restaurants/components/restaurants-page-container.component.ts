import { Component } from '@angular/core';

@Component({
  selector: 'app-restaurants-page-container',
  standalone: true,
  template: `
    <section class="mx-auto w-full max-w-[1160px] space-y-5 px-2 pb-8 md:space-y-6 md:px-4">
      <ng-content />
    </section>
  `,
})
export class RestaurantsPageContainerComponent {}

