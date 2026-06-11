import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, AppButtonComponent, AppSurfaceCardComponent],
  template: `
    <section class="page-shell main-stack">
      <app-surface-card variant="hero">
        <app-page-header
          eyebrow="AppuraPe"
          title="Conecta tu pedido con la red que ya se mueve cerca"
          subtitle="Explora negocios locales, arma tu pedido y sigue cada paso dentro de una plataforma pensada para delivery, colaboradores verificados y confianza comunitaria."
        />

        <div class="hero-actions">
          <app-button variant="secondary" [routerLink]="'/businesses'">Explorar negocios</app-button>
          @if (isAuthenticated()) {
            <app-button variant="ghost" [routerLink]="'/orders'">Mis pedidos</app-button>
          } @else {
            <app-button variant="ghost" [routerLink]="'/login'">Iniciar sesion</app-button>
          }
        </div>
      </app-surface-card>

      <div class="grid cards">
        <app-surface-card>
          <span class="eyebrow">Explora</span>
          <h2>Negocios y comercios listos para moverse</h2>
          <p class="muted">Revisa zona, horario, disponibilidad y catálogo antes de avanzar.</p>
        </app-surface-card>

        <app-surface-card>
          <span class="eyebrow">Pedido</span>
          <h2>Carrito simple dentro de una red confiable</h2>
          <p class="muted">Agrega productos, confirma entrega y deja que el backend valide el total final.</p>
        </app-surface-card>

        <app-surface-card>
          <span class="eyebrow">Confianza</span>
          <h2>Verificados hoy, de confianza manana</h2>
          <p class="muted">La idea es sumar colaboradores que validan identidad y reputacion real para apoyar la red sin friccion.</p>
        </app-surface-card>

        <app-surface-card>
          <span class="eyebrow">Cuenta</span>
          <h2>{{ authLabel() }}</h2>
          <p class="muted">Tu sesion permite crear pedidos y consultar el historial dentro de la misma plataforma.</p>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class HomePageComponent {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly authLabel = computed(() =>
    this.authService.currentUser()?.fullName ? `Sesion de ${this.authService.currentUser()?.fullName}` : 'Sin sesion activa',
  );
}
