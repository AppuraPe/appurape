import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, AppNoticeComponent],
  template: `
    <section class="grid">
      <div class="page-card">
        <app-page-header
          eyebrow="AppuraPe Admin"
          title="Panel administrativo"
          subtitle="Resumen rapido de las revisiones y de la salud de la red."
        />

        <app-notice
          tone="info"
          title="Prioridad de la red"
          message="Revisa primero las cuentas pendientes. Aprobar habilita la operación; suspender bloquea temporalmente el uso de la plataforma."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        } @else if (isLoading()) {
          <div class="message">Cargando pendientes...</div>
        } @else {
          <div class="stats-grid">
            <div class="stat-card">
              <span class="muted">Restaurantes pendientes</span>
              <strong>{{ pendingRestaurantsCount() }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Drivers pendientes</span>
              <strong>{{ pendingDriversCount() }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Comunidad abierta</span>
              <strong>{{ openCommunityRequestsCount() }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Colaboradores activos</span>
              <strong>{{ activeCollaboratorsCount() }}</strong>
            </div>
          </div>
        }

        <div class="page-actions">
          <a class="button" routerLink="/admin/restaurants/pending">Ver restaurantes</a>
          <a class="button secondary" routerLink="/admin/drivers/pending">Ver drivers</a>
          <a class="button secondary" routerLink="/admin/community">Ver comunidad</a>
          <a class="button ghost" routerLink="/admin/restaurants">Todos los restaurantes</a>
          <a class="button ghost" routerLink="/admin/drivers">Todos los drivers</a>
          <button class="button ghost" type="button" (click)="loadDashboard()" [disabled]="isLoading()">Recargar</button>
        </div>
      </div>
    </section>
  `,
})
export class AdminDashboardPageComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly communityApi = inject(CommunityApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingRestaurantsCount = signal(0);
  readonly pendingDriversCount = signal(0);
  readonly openCommunityRequestsCount = signal(0);
  readonly activeCollaboratorsCount = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      restaurants: this.adminApi.getPendingRestaurants(),
      drivers: this.adminApi.getPendingDrivers(),
      community: this.communityApi.getAdminOverview(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ restaurants, drivers, community }) => {
          this.pendingRestaurantsCount.set(restaurants.length);
          this.pendingDriversCount.set(drivers.length);
          this.openCommunityRequestsCount.set(community.publishedRequestsCount);
          this.activeCollaboratorsCount.set(community.activeCollaboratorsCount);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el dashboard admin.'));
          this.isLoading.set(false);
        },
      });
  }
}
