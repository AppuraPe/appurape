import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminRestaurantDetailResponse, AdminStatusAction } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-restaurant-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Admin"
        title="Detalle de restaurante"
        subtitle="Informacion administrativa y acciones de estado."
      />

      <div class="page-actions">
        <a class="button ghost" routerLink="/admin/restaurants">Volver a restaurantes</a>
        <a class="button secondary" routerLink="/admin/restaurants/pending">Pendientes</a>
      </div>

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="message success">{{ successMessage() }}</div>
      }

      @if (isLoading()) {
        <div class="message">Cargando restaurante...</div>
      } @else if (restaurant()) {
        <app-notice
          tone="warning"
          title="Impacto de las acciones"
          message="Approve habilita la operacion, Reject impide operar, Suspend bloquea temporalmente y Reactivate devuelve el acceso si el estado lo permite."
        />

        <div class="stats-grid">
          <div class="stat-card">
            <span class="muted">Aprobacion</span>
            <app-status-badge [status]="restaurant()!.approvalStatus" />
          </div>
          <div class="stat-card">
            <span class="muted">Activo</span>
            <app-status-badge [status]="restaurant()!.isActive" [label]="restaurant()!.isActive ? 'Activo' : 'Inactivo'" />
          </div>
          <div class="stat-card">
            <span class="muted">Usuario</span>
            <app-status-badge [status]="restaurant()!.userStatus" />
          </div>
        </div>

        <div class="inline-actions">
          @for (action of actions; track action.value) {
            <button
              class="button primary-action"
              [class.danger]="action.value === 'reject' || action.value === 'suspend'"
              type="button"
              (click)="updateStatus(action.value)"
              [disabled]="actionInProgress() === action.value"
            >
              {{ actionInProgress() === action.value ? 'Procesando...' : action.label }}
            </button>
          }
        </div>

        <div class="split detail-section">
          <div class="page-card">
            <h2>{{ restaurant()!.name }}</h2>
            <div class="detail-list">
              <div>
                <strong>Owner</strong>
                <p class="muted">{{ restaurant()!.ownerFullName }}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p class="muted">{{ restaurant()!.ownerEmail }}</p>
              </div>
              <div>
                <strong>Telefono</strong>
                <p class="muted">{{ restaurant()!.ownerPhone }}</p>
              </div>
              <div>
                <strong>Descripcion</strong>
                <p class="muted">{{ restaurant()!.description }}</p>
              </div>
              <div>
                <strong>Logo URL</strong>
                @if (restaurant()!.logoUrl) {
                  <p><a class="text-link" [href]="restaurant()!.logoUrl" target="_blank" rel="noreferrer">Abrir logo</a></p>
                } @else {
                  <p class="muted">Sin logo</p>
                }
              </div>
            </div>
          </div>

          <div class="page-card">
            <h2>Operacion</h2>
            <div class="detail-list">
              <div>
                <strong>Direccion</strong>
                <p class="muted">{{ restaurant()!.address }}</p>
              </div>
              <div>
                <strong>Referencia</strong>
                <p class="muted">{{ restaurant()!.reference || 'Sin referencia' }}</p>
              </div>
              <div>
                <strong>Zona</strong>
                <p class="muted">{{ restaurant()!.zoneName }}</p>
              </div>
              <div>
                <strong>Horario</strong>
                <p class="muted">{{ restaurant()!.openTime }} - {{ restaurant()!.closeTime }}</p>
              </div>
              <div>
                <strong>Creado</strong>
                <p class="muted">{{ restaurant()!.createdAtUtc | date: 'medium' }}</p>
              </div>
              <div>
                <strong>Actualizado</strong>
                <p class="muted">{{ restaurant()!.updatedAtUtc ? (restaurant()!.updatedAtUtc | date: 'medium') : 'Sin cambios' }}</p>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class AdminRestaurantDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly actions: Array<{ label: string; value: AdminStatusAction }> = [
    { label: 'Approve', value: 'approve' },
    { label: 'Reject', value: 'reject' },
    { label: 'Suspend', value: 'suspend' },
    { label: 'Reactivate', value: 'reactivate' },
  ];

  readonly restaurant = signal<AdminRestaurantDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly actionInProgress = signal<AdminStatusAction | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  private readonly restaurantId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.loadRestaurant();
  }

  loadRestaurant(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getRestaurantById(this.restaurantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurant) => {
          this.restaurant.set(restaurant);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el restaurante.'));
          this.isLoading.set(false);
        },
      });
  }

  updateStatus(action: AdminStatusAction): void {
    this.actionInProgress.set(action);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminApi
      .updateRestaurantStatus(this.restaurantId, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurant) => {
          this.restaurant.set(restaurant);
          this.successMessage.set(`Accion ${action} aplicada correctamente.`);
          this.actionInProgress.set(null);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo aplicar la accion ${action}.`));
          this.actionInProgress.set(null);
        },
      });
  }
}
