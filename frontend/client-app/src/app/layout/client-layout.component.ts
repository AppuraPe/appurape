import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="page-shell topbar-inner">
        <a class="brand" routerLink="/restaurants" aria-label="Ir a restaurantes AppuraPe">
          <span class="brand-mark">A</span>
          <span>
            <strong>AppuraPe</strong>
            <small>Delivery local</small>
          </span>
        </a>

        <nav class="nav-links" aria-label="Navegacion principal">
          <a routerLink="/restaurants" routerLinkActive="active-link">Restaurantes</a>
          @if (isAuthenticated()) {
            <a routerLink="/orders" routerLinkActive="active-link">Mis pedidos</a>
          }
        </nav>

        <div class="auth-actions">
          @if (currentUser()) {
            <div class="user-box">
              <span>Sesion activa</span>
              <strong>{{ displayName() }}</strong>
            </div>
            <button class="button ghost" type="button" (click)="logout()">Cerrar sesion</button>
          } @else {
            <a class="button ghost" routerLink="/login">Login</a>
            <a class="button secondary" routerLink="/register">Crear cuenta</a>
          }
        </div>
      </div>
    </header>

    <main class="main-shell">
      <router-outlet />
    </main>
  `,
  styles: `
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(16px);
      background: rgba(255, 255, 255, 0.88);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 8px 24px rgba(16, 47, 37, 0.04);
    }

    .topbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 76px;
      padding-block: 0.8rem;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--brand-900);
      text-decoration: none;
    }

    .brand-mark {
      display: grid;
      width: 46px;
      height: 46px;
      place-items: center;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--brand-800), var(--brand-600));
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      box-shadow: 0 12px 24px rgba(21, 71, 52, 0.18);
    }

    .brand strong,
    .brand small {
      display: block;
    }

    .brand strong {
      font-size: 1.2rem;
      line-height: 1;
    }

    .brand small {
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 800;
      margin-top: 0.15rem;
    }

    .nav-links,
    .auth-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .nav-links {
      padding: 0.35rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.68);
    }

    .nav-links a {
      padding: 0.55rem 0.9rem;
      border-radius: 999px;
      color: var(--text-muted);
      font-weight: 800;
      text-decoration: none;
    }

    .nav-links a.active-link {
      background: var(--brand-100);
      color: var(--brand-800);
    }

    .user-box {
      display: grid;
      gap: 0.1rem;
      text-align: right;
      font-size: 0.9rem;
    }

    .user-box span {
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .user-box strong {
      color: var(--text-strong);
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .main-shell {
      padding: 2rem 0 3.5rem;
    }

    @media (max-width: 900px) {
      .topbar-inner {
        align-items: flex-start;
        flex-direction: column;
      }

      .nav-links,
      .auth-actions {
        width: 100%;
      }

      .nav-links {
        justify-content: center;
      }

      .auth-actions {
        justify-content: space-between;
      }

      .user-box {
        text-align: left;
      }
    }

    @media (max-width: 640px) {
      .topbar {
        position: sticky;
      }

      .topbar-inner {
        gap: 0.7rem;
        min-height: 0;
        padding-block: 0.65rem;
      }

      .brand {
        width: 100%;
        justify-content: space-between;
      }

      .brand-mark {
        width: 40px;
        height: 40px;
        border-radius: 14px;
      }

      .brand strong {
        font-size: 1.05rem;
      }

      .brand small {
        font-size: 0.72rem;
      }

      .nav-links {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.45rem;
        width: 100%;
        padding: 0.35rem;
        border-radius: 18px;
      }

      .nav-links a {
        display: inline-flex;
        justify-content: center;
        min-height: 44px;
        padding: 0.7rem 0.5rem;
        text-align: center;
      }

      .auth-actions {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.55rem;
      }

      .auth-actions .button {
        width: 100%;
        min-height: 46px;
      }

      .user-box {
        width: 100%;
        padding: 0.65rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.75);
      }

      .user-box strong {
        max-width: 100%;
      }

      .main-shell {
        padding: 1rem 0 3.5rem;
      }
    }
  `,
})
export class ClientLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly displayName = computed(() => this.authService.currentUser()?.fullName || this.authService.currentUser()?.email);

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
