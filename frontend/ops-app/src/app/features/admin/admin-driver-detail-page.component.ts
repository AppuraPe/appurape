import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminDriverDetailResponse, AdminStatusAction } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-driver-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Admin"
        title="Detalle de driver"
        subtitle="Informacion administrativa y acciones de estado."
      />

      <div class="page-actions">
        <a class="button ghost" routerLink="/admin/drivers">Volver a drivers</a>
        <a class="button secondary" routerLink="/admin/drivers/pending">Pendientes</a>
      </div>

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="message success">{{ successMessage() }}</div>
      }

      @if (isLoading()) {
        <div class="message">Cargando driver...</div>
      } @else if (driver()) {
        <app-notice
          tone="warning"
          title="Impacto de las acciones"
          message="Approve habilita al driver, Reject impide operar, Suspend bloquea temporalmente y Reactivate devuelve el acceso si el estado lo permite."
        />

        <div class="stats-grid">
          <div class="stat-card">
            <span class="muted">Aprobacion</span>
            <app-status-badge [status]="driver()!.approvalStatus" />
          </div>
          <div class="stat-card">
            <span class="muted">Disponible</span>
            <app-status-badge [status]="driver()!.isAvailable" [label]="driver()!.isAvailable ? 'Disponible' : 'No disponible'" />
          </div>
          <div class="stat-card">
            <span class="muted">Usuario</span>
            <app-status-badge [status]="driver()!.userStatus" />
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
            <h2>{{ driver()!.fullName }}</h2>
            <div class="detail-list">
              <div>
                <strong>Email</strong>
                <p class="muted">{{ driver()!.email }}</p>
              </div>
              <div>
                <strong>Telefono</strong>
                <p class="muted">{{ driver()!.phone }}</p>
              </div>
              <div>
                <strong>Vehiculo</strong>
                <p class="muted">{{ driver()!.vehicleType }} - {{ driver()!.plate }}</p>
              </div>
              <div>
                <strong>Zona</strong>
                <p class="muted">{{ driver()!.zoneName }}</p>
              </div>
            </div>
          </div>

          <div class="page-card">
            <h2>Documentos</h2>
            <div class="detail-list">
              <div>
                <strong>Documento identidad</strong>
                @if (driver()!.identityDocumentUrl) {
                  <p><a class="text-link" [href]="driver()!.identityDocumentUrl" target="_blank" rel="noreferrer">Abrir documento</a></p>
                } @else {
                  <p class="muted">Sin documento</p>
                }
              </div>
              <div>
                <strong>Foto vehiculo</strong>
                @if (driver()!.vehiclePhotoUrl) {
                  <p><a class="text-link" [href]="driver()!.vehiclePhotoUrl" target="_blank" rel="noreferrer">Abrir foto</a></p>
                } @else {
                  <p class="muted">Sin foto</p>
                }
              </div>
              <div>
                <strong>Creado</strong>
                <p class="muted">{{ driver()!.createdAtUtc | date: 'medium' }}</p>
              </div>
              <div>
                <strong>Actualizado</strong>
                <p class="muted">{{ driver()!.updatedAtUtc ? (driver()!.updatedAtUtc | date: 'medium') : 'Sin cambios' }}</p>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class AdminDriverDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly actions: Array<{ label: string; value: AdminStatusAction }> = [
    { label: 'Approve', value: 'approve' },
    { label: 'Reject', value: 'reject' },
    { label: 'Suspend', value: 'suspend' },
    { label: 'Reactivate', value: 'reactivate' },
  ];

  readonly driver = signal<AdminDriverDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly actionInProgress = signal<AdminStatusAction | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  private readonly driverId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.loadDriver();
  }

  loadDriver(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getDriverById(this.driverId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (driver) => {
          this.driver.set(driver);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el driver.'));
          this.isLoading.set(false);
        },
      });
  }

  updateStatus(action: AdminStatusAction): void {
    this.actionInProgress.set(action);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminApi
      .updateDriverStatus(this.driverId, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (driver) => {
          this.driver.set(driver);
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
