import { Component, input } from '@angular/core';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: '',
})
export class AppBackButtonComponent {
  // Inputs remain temporarily compatible with existing screens while the
  // visual control is retired in favor of Android system back navigation.
  readonly fallbackUrl = input('/businesses');
  readonly label = input('Volver');
}
