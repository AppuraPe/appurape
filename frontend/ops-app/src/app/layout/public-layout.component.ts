import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { AppNavigationService } from '../core/services/app-navigation.service';
import { CheckoutDrawerUiService } from '../core/services/checkout-drawer-ui.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgTemplateOutlet],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navigation = inject(AppNavigationService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly currentRole = computed(() => this.authService.currentRole());
  readonly defaultRoute = computed(() => this.authService.getDefaultRoute());
  readonly displayName = computed(
    () => this.authService.currentUser()?.fullName || this.authService.currentUser()?.email || 'Usuario',
  );
  readonly primaryDestinationLabel = computed(() =>
    this.currentRole() === 'Customer' ? 'Mis pedidos' : 'Mi panel',
  );
  readonly primaryDestinationRoute = computed(() =>
    this.currentRole() === 'Customer' ? '/orders' : this.defaultRoute(),
  );
  readonly communityRoute = computed(() => '/community');
  readonly isNavbarOpen = signal(false);
  readonly isUserDropdownOpen = signal(false);
  readonly currentPath = signal(this.router.url);
  readonly mobileBackFallback = computed(() => {
    const path = this.currentPath();

    if (path.startsWith('/restaurants/')) {
      return '/restaurants';
    }

    if (path.startsWith('/orders/')) {
      return '/orders';
    }

    if (path.startsWith('/community/requests/')) {
      return '/community';
    }

    if (path.startsWith('/register')) {
      return '/restaurants';
    }

    return '/restaurants';
  });
  readonly shouldShowMobileBack = computed(() => {
    const path = this.currentPath();
    return path.startsWith('/restaurants/') || path.startsWith('/orders/') || path.startsWith('/community/requests/') || path === '/register';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
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
}
