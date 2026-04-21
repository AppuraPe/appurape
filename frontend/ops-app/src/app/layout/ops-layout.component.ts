import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { StatusBadgeComponent } from '../shared/components/status-badge.component';

interface NavItem {
  label: string;
  path: string;
  helper?: string;
}

@Component({
  selector: 'app-ops-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StatusBadgeComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-top">
          <a class="brand" [routerLink]="defaultRoute()">
            <span class="brand-mark">AP</span>
            <span>
              AppuraPe
              <small>Panel operativo</small>
            </span>
          </a>

          <div class="operator-card">
            <span class="operator-label">Sesion activa</span>
            <strong>{{ currentUser()?.fullName || 'Operador' }}</strong>
            <small>{{ currentUser()?.email || 'Sin email' }}</small>
            <app-status-badge [status]="currentUser()?.role" prefix="Rol" />
          </div>

          <div class="nav-heading">{{ navHeading() }}</div>
          <nav class="nav-links">
            @for (item of navItems(); track item.path) {
              <a
                routerLinkActive="active-link"
                [routerLinkActiveOptions]="{ exact: true }"
                [routerLink]="item.path"
              >
                <span>{{ item.label }}</span>
                @if (item.helper) {
                  <small>{{ item.helper }}</small>
                }
              </a>
            }
          </nav>
        </div>

        <button class="button secondary logout-button" type="button" (click)="logout()">Cerrar sesion</button>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: 304px minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.25rem;
      padding: 1.2rem;
      border-right: 1px solid var(--border);
      background:
        radial-gradient(circle at top left, rgba(217, 104, 43, 0.14), transparent 32%),
        linear-gradient(180deg, #ffffff 0%, #edf5ef 100%);
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .sidebar-top {
      display: grid;
      gap: 1rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      color: var(--brand-950);
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: 950;
      letter-spacing: -0.04em;
    }

    .brand small {
      display: block;
      color: var(--text-muted);
      font-size: 0.76rem;
      font-weight: 750;
      letter-spacing: 0;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 16px;
      background: var(--brand-800);
      color: #fff;
      box-shadow: 0 14px 26px rgba(31, 87, 71, 0.22);
      font-size: 0.9rem;
      letter-spacing: 0.02em;
    }

    .operator-card {
      display: grid;
      gap: 0.45rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.86);
      border: 1px solid var(--border);
      border-radius: 22px;
      box-shadow: var(--shadow-soft);
    }

    .operator-card strong {
      font-size: 1rem;
    }

    .operator-card small,
    .operator-label {
      color: var(--text-muted);
    }

    .operator-label {
      font-size: 0.76rem;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .nav-heading {
      padding: 0 0.2rem;
      color: var(--text-muted);
      font-size: 0.76rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .nav-links {
      display: grid;
      gap: 0.45rem;
    }

    .nav-links a {
      display: grid;
      gap: 0.15rem;
      padding: 0.85rem 0.95rem;
      border: 1px solid transparent;
      border-radius: 16px;
      text-decoration: none;
      color: var(--text-muted);
      font-weight: 850;
    }

    .nav-links a small {
      font-size: 0.75rem;
      font-weight: 650;
    }

    .nav-links a.active-link {
      background: var(--brand-800);
      border-color: var(--brand-700);
      color: #fff;
      box-shadow: 0 14px 24px rgba(31, 87, 71, 0.17);
    }

    .content {
      padding: 1.5rem;
      min-width: 0;
    }

    .logout-button {
      width: 100%;
    }

    @media (max-width: 920px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: sticky;
        top: 0;
        z-index: 30;
        height: auto;
        padding: 0.9rem;
        border-right: 0;
        border-bottom: 1px solid var(--border);
      }

      .content {
        padding: 1rem;
      }

      .sidebar-top {
        gap: 0.8rem;
      }

      .operator-card {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        border-radius: 18px;
        padding: 0.85rem;
      }

      .operator-card app-status-badge {
        justify-self: end;
      }

      .nav-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }

      .nav-links a {
        flex: 1 1 12rem;
      }

      .logout-button {
        min-height: 48px;
      }
    }

    @media (max-width: 640px) {
      .sidebar {
        gap: 0.75rem;
      }

      .brand {
        font-size: 1.08rem;
      }

      .brand-mark {
        width: 40px;
        height: 40px;
        border-radius: 14px;
      }

      .operator-card {
        grid-template-columns: 1fr;
        gap: 0.35rem;
      }

      .operator-card app-status-badge {
        justify-self: start;
      }

      .nav-heading {
        display: none;
      }

      .nav-links a {
        flex-basis: calc(50% - 0.35rem);
        min-width: 0;
        min-height: 54px;
        padding: 0.75rem 0.85rem;
      }

      .nav-links a small {
        display: none;
      }

      .content {
        padding: 0.75rem;
      }
    }
  `,
})
export class OpsLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly defaultRoute = computed(() => this.authService.getDefaultRoute());
  readonly navHeading = computed(() => {
    const role = this.authService.getCurrentRole();

    if (role === 'Admin') {
      return 'Control y aprobaciones';
    }

    if (role === 'Restaurant') {
      return 'Operacion restaurante';
    }

    if (role === 'Driver') {
      return 'Operacion driver';
    }

    return 'Navegacion';
  });

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.authService.getCurrentRole();

    switch (role) {
      case 'Restaurant':
        return [
          { label: 'Dashboard', path: '/restaurant/dashboard', helper: 'Estado y resumen' },
          { label: 'Pedidos', path: '/restaurant/orders', helper: 'Preparacion y pickup' },
          { label: 'Perfil', path: '/restaurant/profile', helper: 'Visibilidad publica' },
          { label: 'Categorias', path: '/restaurant/menu/categories', helper: 'Organiza menu' },
          { label: 'Productos', path: '/restaurant/menu/items', helper: 'Disponibilidad' },
        ];
      case 'Driver':
        return [
          { label: 'Dashboard', path: '/driver/dashboard', helper: 'Estado operativo' },
          { label: 'Pedidos disponibles', path: '/driver/orders/available', helper: 'Listos para tomar' },
          { label: 'Mis pedidos', path: '/driver/orders/my', helper: 'Siguiente accion' },
        ];
      case 'Admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', helper: 'Pendientes clave' },
          { label: 'Restaurantes pendientes', path: '/admin/restaurants/pending', helper: 'Aprobar o rechazar' },
          { label: 'Drivers pendientes', path: '/admin/drivers/pending', helper: 'Aprobar o rechazar' },
          { label: 'Todos los restaurantes', path: '/admin/restaurants', helper: 'Estados y detalle' },
          { label: 'Todos los drivers', path: '/admin/drivers', helper: 'Estados y detalle' },
        ];
      default:
        return [];
    }
  });

  constructor() {
    if (this.router.url === '/' || this.router.url === '') {
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
