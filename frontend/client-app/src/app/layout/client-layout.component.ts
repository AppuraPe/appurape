import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CheckoutDrawerUiService } from '../core/services/checkout-drawer-ui.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgTemplateOutlet],
  templateUrl: './client-layout.component.html',
})
export class ClientLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly displayName = computed(() => this.authService.currentUser()?.fullName || this.authService.currentUser()?.email || 'Usuario');
  readonly isNavbarOpen = signal(false);
  readonly isUserDropdownOpen = signal(false);

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
