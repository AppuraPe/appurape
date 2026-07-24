import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppNavigationService } from './core/services/app-navigation.service';
import { CheckoutDrawerUiService } from './core/services/checkout-drawer-ui.service';
import { PlatformSettingsApiService } from './core/services/platform-settings-api.service';
import { ToastContainerComponent } from './shared/toast/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
})
export class App {
  private readonly navigation = inject(AppNavigationService);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);

  constructor() {
    void this.platformSettingsApi.ensureLoaded();
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

        const fallbackUrl = this.resolveNativeBackFallback();

        if (this.navigation.canGoBack()) {
          this.navigation.goBack(fallbackUrl);
          return;
        }

        if (this.router.url !== '/businesses') {
          void this.router.navigateByUrl(fallbackUrl);
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

  private resolveNativeBackFallback(): string {
    const path = this.router.url.split('?')[0]?.split('#')[0] || '/businesses';
    const productMatch = path.match(/^\/businesses\/([^/]+)\/products\/[^/]+$/);

    if (productMatch) {
      return `/businesses/${productMatch[1]}`;
    }

    if (path.startsWith('/businesses/') || path.startsWith('/restaurants/')) {
      return '/businesses';
    }

    return '/businesses';
  }
}
