import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppNavigationService } from './core/services/app-navigation.service';
import { AuthService } from './core/services/auth.service';
import { CheckoutDrawerUiService } from './core/services/checkout-drawer-ui.service';
import { PlatformSettingsApiService } from './core/services/platform-settings-api.service';
import { ToastContainerComponent } from './shared/toast/toast-container.component';
import { NotificationPermissionCardComponent } from './shared/components/notification-permission-card.component';
import { ToastService } from './shared/toast/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, NotificationPermissionCardComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-notification-permission-card />
  `,
})
export class App {
  private readonly navigation = inject(AppNavigationService);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  private lastExitAttemptAt = 0;

  private static readonly EXIT_CONFIRMATION_WINDOW_MS = 3_000;

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

        const currentPath = this.currentPath();
        const rootPath = this.rootPath();

        const isRoot =
          currentPath === rootPath ||
          (rootPath === '/businesses' && (currentPath === '/' || currentPath === '/businesses'));

        if (isRoot) {
          const now = Date.now();

          if (now - this.lastExitAttemptAt <= App.EXIT_CONFIRMATION_WINDOW_MS) {
            this.lastExitAttemptAt = 0;
            void CapacitorApp.exitApp();
            return;
          }

          this.lastExitAttemptAt = now;
          this.toast.info('Presiona Atrás otra vez para salir de la app', App.EXIT_CONFIRMATION_WINDOW_MS);
          return;
        }

        this.lastExitAttemptAt = 0;
        const fallbackUrl = this.resolveNativeBackFallback();

        if (this.navigation.canGoBack()) {
          this.navigation.goBack(fallbackUrl);
          return;
        }

        void this.router.navigateByUrl(fallbackUrl);
      });

      this.destroyRef.onDestroy(() => {
        void listener.remove();
      });
    } catch {
      // Ignore when the native App plugin is not available.
    }
  }

  private rootPath(): string {
    if (this.authService.isAuthenticated()) {
      return this.authService.getDefaultRoute();
    }
    return '/businesses';
  }

  private resolveNativeBackFallback(): string {
    const path = this.currentPath();
    const root = this.rootPath();

    if (path.startsWith('/driver/')) {
      return '/driver/dashboard';
    }

    if (path.startsWith('/business/') || path.startsWith('/restaurant/')) {
      return '/business/dashboard';
    }

    if (path.startsWith('/admin/')) {
      return '/admin/dashboard';
    }

    const productMatch = path.match(/^\/businesses\/([^/]+)\/products\/[^/]+$/);

    if (productMatch) {
      return `/businesses/${productMatch[1]}`;
    }

    if (path.startsWith('/businesses/') || path.startsWith('/restaurants/')) {
      return '/businesses';
    }

    return root;
  }

  private currentPath(): string {
    return this.router.url.split('?')[0]?.split('#')[0] || this.rootPath();
  }
}
