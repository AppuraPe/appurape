import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Bell, CircleUserRound, Heart, House, LucideAngularModule, PackageCheck, User, UserPlus } from 'lucide-angular';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { AppNavigationService } from '../core/services/app-navigation.service';
import { CheckoutDrawerUiService } from '../core/services/checkout-drawer-ui.service';
import { PlatformSettingsApiService } from '../core/services/platform-settings-api.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgTemplateOutlet, LucideAngularModule],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navigation = inject(AppNavigationService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);
  readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly branding = this.platformSettingsApi.settings;
  readonly currentRole = computed(() => this.authService.currentRole());
  readonly isCustomerRole = computed(() => this.currentRole() === 'Customer');
  readonly isOperationsRole = computed(() => {
    const role = this.currentRole();
    return role === 'Restaurant' || role === 'Driver' || role === 'Admin';
  });
  readonly defaultRoute = computed(() => this.authService.getDefaultRoute());
  readonly hasNotificationInbox = false;
  readonly displayName = computed(
    () => this.authService.currentUser()?.fullName || this.authService.currentUser()?.email || 'Usuario',
  );
  readonly primaryDestinationLabel = computed(() =>
    this.currentRole() === 'Customer' ? 'Mis pedidos' : 'Mi panel',
  );
  readonly primaryDestinationRoute = computed(() =>
    this.currentRole() === 'Customer' ? '/orders' : this.defaultRoute(),
  );
  readonly profileRoute = computed(() =>
    this.currentRole() === 'Restaurant'
      ? '/business/profile'
      : this.currentRole() === 'Customer'
        ? '/account/profile'
        : this.defaultRoute(),
  );
  readonly communityRoute = computed(() => '/community');
  readonly isNavbarOpen = signal(false);
  readonly isUserDropdownOpen = signal(false);
  readonly brandingLogoFailed = signal(false);
  readonly currentPath = signal(this.router.url);
  readonly mobileBackFallback = computed(() => {
    const path = this.normalizedPath();

    const productMatch = path.match(/^\/businesses\/([^/]+)\/products\/[^/]+$/);

    if (productMatch) {
      return `/businesses/${productMatch[1]}`;
    }

    if (path.startsWith('/restaurants/') || path.startsWith('/businesses/')) {
      return '/businesses';
    }

    if (path.startsWith('/orders/')) {
      return '/orders';
    }

    if (path.startsWith('/community/requests/') || path.startsWith('/favors/')) {
      return '/community';
    }

    if (path.startsWith('/register')) {
      return '/businesses';
    }

    return '/businesses';
  });
  readonly shouldShowMobileBack = computed(() => {
    const path = this.normalizedPath();
    return path.startsWith('/businesses/') || path.startsWith('/restaurants/') || path.startsWith('/orders/') || path.startsWith('/community/requests/') || path.startsWith('/favors/') || path === '/register';
  });
  readonly shouldHideMobileHeader = computed(() => {
    const path = this.normalizedPath();
    return path === '/businesses' || path === '/restaurants' || path.startsWith('/businesses/') || path.startsWith('/restaurants/');
  });
  readonly shouldHideMobileBottomNav = computed(() => this.normalizedPath() === '/register');
  readonly shouldShowNotificationBell = computed(() => this.isAuthenticated() && this.hasNotificationInbox);
  readonly bellIcon = Bell;
  readonly homeIcon = House;
  readonly heartIcon = Heart;
  readonly userIcon = User;
  readonly userPlusIcon = UserPlus;
  readonly ordersIcon = PackageCheck;
  readonly profileIcon = CircleUserRound;

  constructor() {
    void this.platformSettingsApi.ensureLoaded();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (this.canonicalizeLegacyBusinessesRoute(event.urlAfterRedirects)
          || this.canonicalizeLegacyCommunityRoute(event.urlAfterRedirects)) {
          this.closeNavbar();
          this.closeUserDropdown();
          return;
        }

        this.currentPath.set(event.urlAfterRedirects);
        this.closeNavbar();
        this.closeUserDropdown();
      });
  }

  toggleNavbar(): void {
    this.isNavbarOpen.update((current) => !current);
  }

  closeNavbar(): void {
    this.isNavbarOpen.set(false);
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen.update((current) => !current);
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen.set(false);
  }

  goBack(): void {
    this.closeNavbar();
    this.closeUserDropdown();
    this.navigation.goBack(this.mobileBackFallback());
  }

  logout(): void {
    this.closeNavbar();
    this.closeUserDropdown();
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.hostElement.nativeElement.contains(event.target as Node)) {
      this.closeNavbar();
      this.closeUserDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeNavbar();
    this.closeUserDropdown();
    this.checkoutDrawerUi.close();
  }

  markBrandingLogoFailed(): void {
    this.brandingLogoFailed.set(true);
  }

  private normalizedPath(): string {
    return this.currentPath().split('?')[0]?.split('#')[0] || '/';
  }

  private canonicalizeLegacyBusinessesRoute(url: string): boolean {
    const urlTree = this.router.parseUrl(url);
    const primarySegments = urlTree.root.children['primary']?.segments.map((segment) => segment.path) ?? [];

    if (!primarySegments.length || primarySegments[0] !== 'restaurants') {
      return false;
    }

    const commands = primarySegments.length > 1 ? ['/businesses', primarySegments[1]] : ['/businesses'];

    void this.router.navigate(commands, {
      queryParams: urlTree.queryParams,
      fragment: urlTree.fragment ?? undefined,
      replaceUrl: true,
    });

    return true;
  }

  private canonicalizeLegacyCommunityRoute(url: string): boolean {
    const urlTree = this.router.parseUrl(url);
    const primarySegments = urlTree.root.children['primary']?.segments.map((segment) => segment.path) ?? [];

    if (!primarySegments.length || primarySegments[0] !== 'favors') {
      return false;
    }

    const commands = primarySegments.length > 1
      ? ['/community/requests', primarySegments[1]]
      : ['/community'];

    void this.router.navigate(commands, {
      queryParams: urlTree.queryParams,
      fragment: urlTree.fragment ?? undefined,
      replaceUrl: true,
    });

    return true;
  }
}
