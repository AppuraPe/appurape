import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MyRestaurantResponse, UpdateMyRestaurantRequest } from '../../core/models/restaurant.models';
import { MyRestaurantApiService } from '../../core/services/my-restaurant-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-restaurant-profile-page',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="page-card">
      <app-page-header
        eyebrow="Restaurant"
        title="Perfil del restaurante"
        subtitle="Vista real del perfil con actualizacion basica por PUT."
      />

      @if (errorMessage()) {
        <div class="message error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="message success">{{ successMessage() }}</div>
      }

      @if (isLoading()) {
        <div class="message">Cargando perfil...</div>
      } @else if (restaurant()) {
        @if (restaurant()!.approvalStatus === 'Pending') {
          <app-notice
            tone="warning"
            title="Pendiente de aprobacion"
            message="Tu restaurante aun no aparece al publico porque sigue pendiente de aprobacion administrativa."
          />
        }

        @if (restaurant()!.approvalStatus === 'Approved' && restaurant()!.isActive) {
          <app-notice
            tone="success"
            title="Visible para operar"
            message="Tu restaurante esta aprobado y activo. Mantener perfil, horario y menu actualizados ayuda a evitar pedidos incorrectos."
          />
        }

        @if (!restaurant()!.isActive || restaurant()!.approvalStatus === 'Rejected') {
          <app-notice
            tone="danger"
            title="No disponible al publico"
            message="Tu restaurante no puede recibir pedidos mientras este inactivo, rechazado o suspendido."
          />
        }

        <div class="stats-grid">
          <div class="stat-card">
            <span class="muted">Zona</span>
            <strong>{{ restaurant()!.zoneName }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Estado</span>
            <strong><app-status-badge [status]="restaurant()!.isActive" [label]="restaurant()!.isActive ? 'Activo' : 'Inactivo'" /></strong>
          </div>
          <div class="stat-card">
            <span class="muted">Aprobacion</span>
            <strong><app-status-badge [status]="restaurant()!.approvalStatus" /></strong>
          </div>
        </div>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
          <div class="form-grid two-col">
            <div class="field">
              <label for="name">Nombre</label>
              <input id="name" type="text" formControlName="name" />
            </div>

            <div class="field">
              <label for="logoUrl">Logo URL</label>
              <input id="logoUrl" type="text" formControlName="logoUrl" />
            </div>

            <div class="field">
              <label for="address">Direccion</label>
              <input id="address" type="text" formControlName="address" />
            </div>

            <div class="field">
              <label for="reference">Referencia</label>
              <input id="reference" type="text" formControlName="reference" />
            </div>

            <div class="field">
              <label for="openTime">Hora apertura</label>
              <input id="openTime" type="time" formControlName="openTime" />
            </div>

            <div class="field">
              <label for="closeTime">Hora cierre</label>
              <input id="closeTime" type="time" formControlName="closeTime" />
            </div>
          </div>

          <div class="field">
            <label for="description">Descripcion</label>
            <textarea id="description" rows="4" formControlName="description"></textarea>
          </div>

          <div class="page-actions">
            <button class="button primary-action" type="submit" [disabled]="isSaving()">
              {{ isSaving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button class="button ghost" type="button" (click)="loadProfile()" [disabled]="isSaving()">
              Recargar
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class RestaurantProfilePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myRestaurantApi = inject(MyRestaurantApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restaurant = signal<MyRestaurantResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    address: ['', [Validators.required]],
    reference: [''],
    openTime: ['', [Validators.required]],
    closeTime: ['', [Validators.required]],
    logoUrl: [''],
  });

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.myRestaurantApi
      .getMyRestaurant()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurant) => {
          this.restaurant.set(restaurant);
          this.form.setValue({
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            reference: restaurant.reference ?? '',
            openTime: this.toTimeInputValue(restaurant.openTime),
            closeTime: this.toTimeInputValue(restaurant.closeTime),
            logoUrl: restaurant.logoUrl ?? '',
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el perfil del restaurante.'));
          this.isLoading.set(false);
        },
      });
  }

  save(): void {
    const restaurant = this.restaurant();

    if (!restaurant) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: UpdateMyRestaurantRequest = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      address: raw.address.trim(),
      reference: raw.reference.trim(),
      zoneId: restaurant.zoneId,
      openTime: this.toApiTimeValue(raw.openTime),
      closeTime: this.toApiTimeValue(raw.closeTime),
      logoUrl: raw.logoUrl.trim() || null,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.myRestaurantApi
      .updateMyRestaurant(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedRestaurant) => {
          this.restaurant.set(updatedRestaurant);
          this.successMessage.set('Perfil actualizado correctamente.');
          this.isSaving.set(false);
          this.form.patchValue({
            openTime: this.toTimeInputValue(updatedRestaurant.openTime),
            closeTime: this.toTimeInputValue(updatedRestaurant.closeTime),
            logoUrl: updatedRestaurant.logoUrl ?? '',
          });
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el perfil del restaurante.'));
          this.isSaving.set(false);
        },
      });
  }

  private toTimeInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 5);
  }

  private toApiTimeValue(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }
}
