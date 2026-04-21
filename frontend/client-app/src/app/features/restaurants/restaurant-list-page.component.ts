import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RestaurantListItemResponse } from '../../core/models/restaurants.models';
import { RestaurantsApiService } from '../../core/services/restaurants-api.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-restaurant-list-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="page-shell main-stack">
      <div class="hero-card">
        <app-page-header
          eyebrow="Restaurantes"
          title="Elige donde pedir hoy"
          subtitle="Compara restaurantes por zona, horario y disponibilidad. Entra al detalle para ver el menu y crear tu pedido."
        />
        <div class="hero-actions">
          <span class="badge success">Pedido guiado</span>
          <span class="badge">Menu por restaurante</span>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="alert error">
          <strong class="alert-title">No pudimos cargar restaurantes</strong>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      @if (isLoading()) {
        <div class="app-card loading-state">
          <span class="eyebrow">Cargando</span>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
        </div>
      } @else if (!restaurants().length) {
        <div class="empty-state">
          <div class="empty-state-icon">A</div>
          <h2>No hay restaurantes disponibles ahora</h2>
          <p class="muted">Vuelve a intentarlo en unos minutos. Cuando haya restaurantes activos, apareceran aqui con su horario y zona.</p>
        </div>
      } @else {
        <div class="section-heading">
          <div>
            <h2>Restaurantes disponibles</h2>
            <p class="muted">{{ restaurants().length }} opciones listas para explorar.</p>
          </div>
        </div>

        <div class="grid cards">
          @for (restaurant of restaurants(); track restaurant.id) {
            <article class="app-card restaurant-card">
              <div class="restaurant-card-top">
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                  <div class="restaurant-avatar">{{ getInitial(restaurant.name) }}</div>
                  <div>
                    @if (hasZone(restaurant)) {
                      <span class="eyebrow">{{ restaurant.zoneName }}</span>
                    }
                    <h2 style="margin-top: 0.65rem;">{{ restaurant.name }}</h2>
                    <p class="muted">{{ restaurant.description || 'Restaurante disponible para pedidos en AppuraPe.' }}</p>
                  </div>
                </div>
                <span class="badge" [class.success]="restaurant.isOpenNow" [class.warning]="!restaurant.isOpenNow">
                  {{ restaurant.isOpenNow ? 'Abierto' : 'Cerrado' }}
                </span>
              </div>

              <div class="meta-grid">
                @if (hasZone(restaurant)) {
                  <div class="meta-item">
                    <span>Zona</span>
                    <strong>{{ restaurant.zoneName }}</strong>
                  </div>
                }
                <div class="meta-item">
                  <span>Horario</span>
                  <strong>{{ formatSchedule(restaurant.openTime, restaurant.closeTime) }}</strong>
                </div>
              </div>

              @if (hasText(restaurant.reference)) {
                <div class="alert info">
                  <strong class="alert-title">Referencia</strong>
                  <span>{{ restaurant.reference }}</span>
                </div>
              }

              <div class="button-row" style="margin-top: auto;">
                <a class="button full primary-action" [routerLink]="['/restaurants', restaurant.id]">Ver menu y pedir</a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class RestaurantListPageComponent {
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restaurants = signal<RestaurantListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly hasText = hasText;

  constructor() {
    this.restaurantsApi
      .getRestaurants()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurants) => {
          this.restaurants.set(restaurants);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Revisa tu conexion o intenta nuevamente.'));
          this.isLoading.set(false);
        },
      });
  }

  hasZone(restaurant: RestaurantListItemResponse): boolean {
    return hasText(restaurant.zoneName);
  }

  getInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || 'A';
  }

  formatSchedule(openTime: string, closeTime: string): string {
    return `${formatTimeSpan(openTime)} - ${formatTimeSpan(closeTime)}`;
  }
}
