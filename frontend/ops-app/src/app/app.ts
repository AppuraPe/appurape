import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppNavigationService } from './core/services/app-navigation.service';
import { CheckoutDrawerUiService } from './core/services/checkout-drawer-ui.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class App {
  private readonly navigation = inject(AppNavigationService);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    void this.initializeNativeBackButton();
  }

  private async initializeNativeBackButton(): Promise<void> {
    try {
      const [{ App: CapacitorApp }, { Capacitor }] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/core'),
      ]);

      if (!Capacitor.isNativePlatform()) {
        return;
      }

      const listener = await CapacitorApp.addListener('backButton', () => {
        if (this.checkoutDrawerUi.isOpen()) {
          this.checkoutDrawerUi.close();
          return;
        }

        if (this.navigation.canGoBack()) {
          this.navigation.goBack('/restaurants');
          return;
        }

        if (this.router.url !== '/restaurants') {
          void this.router.navigateByUrl('/restaurants');
          return;
        }

        void CapacitorApp.exitApp();
      });

      this.destroyRef.onDestroy(() => {
        void listener.remove();
      });
    } catch {
      // Ignore when the native App plugin is not available.
    }
  }
}
