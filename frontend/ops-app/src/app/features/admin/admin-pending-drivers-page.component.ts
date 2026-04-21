import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PendingDriverResponse } from '../../core/models/driver.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-pending-drivers-page',
  standalone: true,
  imports: [PageHeaderComponent, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Admin"
        title="Drivers pendientes"
        subtitle="Aprueba o rechaza drivers pendientes desde esta vista."
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
        message="Aprobar habilita al driver para tomar pedidos. Rechazar mantiene la cuenta sin acceso operativo."
      />

      <div class="page-actions">
        <button class="button ghost" type="button" (click)="loadDrivers()" [disabled]="isLoading() || !!actionDriverId()">
          Recargar
        </button>
      </div>

      @if (isLoading()) {
        <div class="message">Cargando drivers pendientes...</div>
      } @else if (!drivers().length) {
        <div class="message">No hay drivers pendientes por revisar.</div>
      } @else {
        <div class="list">
          @for (driver of drivers(); track driver.id) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ driver.fullName }}</strong>
                  <span class="muted">{{ driver.email }} | {{ driver.phone }}</span>
                  <span class="muted">{{ driver.vehicleType }} - {{ driver.plate }}</span>
                  <span class="muted">Zona: {{ driver.zoneName }}</span>
                </div>

                <div class="stack align-end">
                  <app-status-badge [status]="driver.approvalStatus" />
                  <app-status-badge [status]="driver.isAvailable" [label]="driver.isAvailable ? 'Disponible' : 'No disponible'" />
                </div>
              </div>

              <div class="inline-actions">
                <button
                  class="button"
                  type="button"
                  (click)="approveDriver(driver)"
                  [disabled]="actionDriverId() === driver.id"
                >
                  {{ actionDriverId() === driver.id ? 'Procesando...' : 'Aprobar' }}
                </button>
                <button
                  class="button danger"
                  type="button"
                  (click)="rejectDriver(driver)"
                  [disabled]="actionDriverId() === driver.id"
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
export class AdminPendingDriversPageComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly drivers = signal<PendingDriverResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly actionDriverId = signal<string | null>(null);

  constructor() {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getPendingDrivers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los drivers pendientes.'));
          this.isLoading.set(false);
        },
      });
  }

  approveDriver(driver: PendingDriverResponse): void {
    this.runDriverAction(driver.id, driver.fullName, 'aprobo', () => this.adminApi.approveDriver(driver.id));
  }

  rejectDriver(driver: PendingDriverResponse): void {
    this.runDriverAction(driver.id, driver.fullName, 'rechazo', () => this.adminApi.rejectDriver(driver.id));
  }

  private runDriverAction(
    id: string,
    fullName: string,
    actionLabel: string,
    request: () => ReturnType<AdminApiService['approveDriver']>,
  ): void {
    this.actionDriverId.set(id);
    this.errorMessage.set('');
    this.successMessage.set('');

    request()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Se ${actionLabel} el driver ${fullName}.`);
          this.actionDriverId.set(null);
          this.loadDrivers();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar el driver ${fullName}.`));
          this.actionDriverId.set(null);
        },
      });
  }
}
