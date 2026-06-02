import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  template: `
    <ngx-sonner-toaster
      [position]="isMobile() ? 'top-center' : 'top-right'"
      [expand]="true"
      [visibleToasts]="4"
      [richColors]="true"
      [offset]="isMobile() ? '12px' : '20px'"
      [closeButton]="true"
      [toastOptions]="{ duration: 4200 }"
    />
    <router-outlet />
  `,
})
export class App {
  readonly isMobile = signal(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isMobile.set(window.innerWidth < 640);
  }
}
