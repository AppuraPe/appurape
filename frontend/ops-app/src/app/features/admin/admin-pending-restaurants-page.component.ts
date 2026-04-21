import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PendingRestaurantResponse } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-pending-restaurants-page',
  standalone: true,
  imports: [PageHeaderComponent, DatePipe, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Admin"
        title="Restaurantes pendientes"
        subtitle="Aprueba o rechaza restaurantes pendientes desde esta vista."
      />

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="message success">{{ successMessage() }}</div>
      }

      <app-notice
        tone="warning"
        title="Revision pendiente"
        message="Aprobar permite que el restaurante empiece a operar. Rechazar mantiene la cuenta sin visibilidad publica ni recepcion de pedidos."
      />

      <div class="page-actions">
        <button class="button ghost" type="button" (click)="loadRestaurants()" [disabled]="isLoading() || !!actionRestaurantId()">
          Recargar
        </button>
      </div>

      @if (isLoading()) {
        <div class="message">Cargando restaurantes pendientes...</div>
      } @else if (!restaurants().length) {
        <div class="message">No hay restaurantes pendientes de revision.</div>
      } @else {
        <div class="list">
          @for (restaurant of restaurants(); track restaurant.id) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ restaurant.name }}</strong>
                  <span class="muted">Propietario: {{ restaurant.ownerFullName }}</span>
                  <span class="muted">{{ restaurant.email }} | {{ restaurant.phone }}</span>
                  <span class="muted">Zona: {{ restaurant.zoneName }}</span>
                </div>

                <div class="stack align-end">
                  <app-status-badge [status]="restaurant.approvalStatus" />
                  <span class="muted">{{ restaurant.createdAtUtc | date: 'medium' }}</span>
                </div>
              </div>

              <div class="inline-actions">
                <button
                  class="button"
                  type="button"
                  (click)="approveRestaurant(restaurant)"
                  [disabled]="actionRestaurantId() === restaurant.id"
                >
                  {{ actionRestaurantId() === restaurant.id ? 'Procesando...' : 'Aprobar' }}
                </button>
                <button
                  class="button danger"
                  type="button"
                  (click)="rejectRestaurant(restaurant)"
                  [disabled]="actionRestaurantId() === restaurant.id"
                >
                  Rechazar
                </button>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class AdminPendingRestaurantsPageComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restaurants = signal<PendingRestaurantResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly actionRestaurantId = signal<string | null>(null);

  constructor() {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getPendingRestaurants()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurants) => {
          this.restaurants.set(restaurants);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los restaurantes pendientes.'));
          this.isLoading.set(false);
        },
      });
  }

  approveRestaurant(restaurant: PendingRestaurantResponse): void {
    this.runRestaurantAction(restaurant.id, restaurant.name, 'aprobo', () => this.adminApi.approveRestaurant(restaurant.id));
  }

  rejectRestaurant(restaurant: PendingRestaurantResponse): void {
    this.runRestaurantAction(restaurant.id, restaurant.name, 'rechazo', () => this.adminApi.rejectRestaurant(restaurant.id));
  }

  private runRestaurantAction(
    id: string,
    name: string,
    actionLabel: string,
    request: () => ReturnType<AdminApiService['approveRestaurant']>,
  ): void {
    this.actionRestaurantId.set(id);
    this.errorMessage.set('');
    this.successMessage.set('');

    request()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Se ${actionLabel} el restaurante ${name}.`);
          this.actionRestaurantId.set(null);
          this.loadRestaurants();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar el restaurante ${name}.`));
          this.actionRestaurantId.set(null);
        },
      });
  }
}
