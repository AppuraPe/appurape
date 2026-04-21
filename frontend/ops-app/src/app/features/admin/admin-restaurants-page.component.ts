import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminRestaurantListItemResponse } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-restaurants-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PageHeaderComponent, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Admin"
        title="Restaurantes"
        subtitle="Listado completo de restaurantes registrados en AppuraPe."
      />

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      <app-notice
        tone="info"
        title="Estados administrativos"
        message="Approved permite operar si el usuario esta activo. Suspended bloquea el acceso operativo aunque el restaurante exista."
      />

      <form class="filters-grid" [formGroup]="filtersForm" (ngSubmit)="loadRestaurants()">
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
          <label for="isActive">Activo</label>
          <select id="isActive" formControlName="isActive">
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
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
        <div class="message">Cargando restaurantes...</div>
      } @else if (!restaurants().length) {
        <div class="message">No hay restaurantes con los filtros seleccionados.</div>
      } @else {
        <div class="list">
          @for (restaurant of restaurants(); track restaurant.restaurantId) {
            <article class="page-card">
              <div class="split">
                <div class="stack">
                  <strong>{{ restaurant.name }}</strong>
                  <span class="muted">Owner: {{ restaurant.ownerFullName }}</span>
                  <span class="muted">{{ restaurant.ownerEmail }}</span>
                  <span class="muted">{{ restaurant.address }}</span>
                  <span class="muted">Zona: {{ restaurant.zoneName }}</span>
                </div>

                <div class="stack align-end">
                  <app-status-badge [status]="restaurant.approvalStatus" prefix="Aprobacion" />
                  <app-status-badge [status]="restaurant.isActive" [label]="restaurant.isActive ? 'Activo' : 'Inactivo'" />
                  <app-status-badge [status]="restaurant.userStatus" prefix="Usuario" />
                  <span class="muted">{{ restaurant.createdAtUtc | date: 'medium' }}</span>
                </div>
              </div>

              <div class="inline-actions">
                <a class="button secondary primary-action" [routerLink]="['/admin/restaurants', restaurant.restaurantId]">Ver detalle</a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class AdminRestaurantsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restaurants = signal<AdminRestaurantListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly filtersForm = this.formBuilder.nonNullable.group({
    approvalStatus: [''],
    isActive: [''],
    userStatus: [''],
  });

  constructor() {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getRestaurants({
        approvalStatus: filters.approvalStatus || undefined,
        isActive: this.toOptionalBoolean(filters.isActive),
        userStatus: filters.userStatus || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurants) => {
          this.restaurants.set(restaurants);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los restaurantes.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      approvalStatus: '',
      isActive: '',
      userStatus: '',
    });
    this.loadRestaurants();
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
