import { Component } from '@angular/core';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';

@Component({
  selector: 'app-businesses-page-container',
  standalone: true,
  imports: [MobilePageShellComponent],
  template: `
    <app-mobile-page-shell>
      <ng-content />
    </app-mobile-page-shell>
  `,
})
export class BusinessesPageContainerComponent {}

