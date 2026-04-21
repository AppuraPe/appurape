import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminDriverListItemResponse } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-drivers-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PageHeaderComponent, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Admin"
        title="Drivers"
        subtitle="Listado completo de drivers registrados en AppuraPe."
      />

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      <app-notice
        tone="info"
        title="Disponibilidad y aprobacion"
        message="Un driver solo puede operar si esta aprobado y su usuario esta activo. La disponibilidad indica si puede recibir/tomar pedidos."
      />

      <form class="filters-grid" [formGroup]="filtersForm" (ngSubmit)="loadDrivers()">
        <div class="field">
          <label for="approvalStatus">Aprobacion</label>
          <select id="approvalStatus" formControlName="approvalStatus">
            <option value="">Todos</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div class="field">
          <label for="isAvailable">Disponible</label>
          <select id="isAvailable" formControlName="isAvailable">
            <option value="">Todos</option>
            <option value="true">Disponible</option>
            <option value="false">No disponible</option>
          </select>
        </div>

        <div class="field">
          <label for="userStatus">Usuario</label>
          <select id="userStatus" formControlName="userStatus">
            <option value="">Todos</option>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div class="page-actions compact">
          <button class="button" type="submit" [disabled]="isLoading()">Aplicar</button>
          <button class="button ghost" type="button" (click)="clearFilters()" [disabled]="isLoading()">Limpiar</button>
        </div>
      </form>

      @if (isLoading()) {
        <div class="message">Cargando drivers...</div>
      } @else if (!drivers().length) {
        <div class="message">No hay drivers con los filtros seleccionados.</div>
      } @else {
        <div class="list">
          @for (driver of drivers(); track driver.driverId) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ driver.fullName }}</strong>
                  <span class="muted">{{ driver.email }} | {{ driver.phone }}</span>
                  <span class="muted">{{ driver.vehicleType }} - {{ driver.plate }}</span>
                  <span class="muted">Zona: {{ driver.zoneName }}</span>
                </div>

                <div class="stack align-end">
                  <app-status-badge [status]="driver.approvalStatus" prefix="Aprobacion" />
                  <app-status-badge [status]="driver.isAvailable" [label]="driver.isAvailable ? 'Disponible' : 'No disponible'" />
                  <app-status-badge [status]="driver.userStatus" prefix="Usuario" />
                  <span class="muted">{{ driver.createdAtUtc | date: 'medium' }}</span>
                </div>
              </div>

              <div class="inline-actions">
                <a class="button secondary primary-action" [routerLink]="['/admin/drivers', driver.driverId]">Ver detalle</a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class AdminDriversPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly drivers = signal<AdminDriverListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly filtersForm = this.formBuilder.nonNullable.group({
    approvalStatus: [''],
    isAvailable: [''],
    userStatus: [''],
  });

  constructor() {
    this.loadDrivers();
  }

  loadDrivers(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getDrivers({
        approvalStatus: filters.approvalStatus || undefined,
        isAvailable: this.toOptionalBoolean(filters.isAvailable),
        userStatus: filters.userStatus || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los drivers.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      approvalStatus: '',
      isAvailable: '',
      userStatus: '',
    });
    this.loadDrivers();
  }

  private toOptionalBoolean(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return null;
  }
}
