import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section>
      <div>
        <app-page-header
          eyebrow="AppuraPe Cliente"
          title="Pide comida local sin perderte en el proceso"
          subtitle="Explora restaurantes, arma tu pedido y revisa el estado desde una experiencia simple y guiada."
        />

        <div class="hero-actions">
          <a class="button secondary" routerLink="/restaurants">Ver restaurantes</a>
          @if (isAuthenticated()) {
            <a class="button ghost" routerLink="/orders">Mis pedidos</a>
          } @else {
            <a class="button ghost" routerLink="/login">Iniciar sesion</a>
          }
        </div>
      </div>

      <div class="grid cards">
        <article class="app-card">
          <span class="eyebrow">Explora</span>
          <h2>Restaurantes claros y faciles de comparar</h2>
          <p class="muted">Revisa zona, horario, disponibilidad y menu antes de avanzar.</p>
        </article>

        <article class="app-card">
          <span class="eyebrow">Pedido</span>
          <h2>Carrito simple dentro del restaurante</h2>
          <p class="muted">Agrega productos, confirma entrega y deja que el backend valide el total final.</p>
        </article>

        <article class="app-card">
          <span class="eyebrow">Cuenta</span>
          <h2>{{ authLabel() }}</h2>
          <p class="muted">Tu sesion permite crear pedidos y consultar el historial.</p>
        </article>
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
