import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StartDriverRegistrationRequest, VehicleType, VehicleTypeOption } from '../../core/models/driver.models';
import { ZoneResponse } from '../../core/models/zone.models';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ZoneApiService } from '../../core/services/zone-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { setRegistrationState } from './registration-flow.storage';

@Component({
  selector: 'app-driver-registration-start-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, AppNoticeComponent],
  template: `
    <section class="auth-page">
      <div class="page-card auth-card wide">
        <app-page-header
          eyebrow="Registro"
          title="Registrar driver en AppuraPe"
          subtitle="Completa tus datos y te enviaremos un codigo al correo."
        />

        <app-notice
          tone="info"
          title="Paso 1 de 3"
          message="Primero registramos tus datos de reparto. Luego validas el correo y creas tu password."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        }

        @if (successMessage()) {
          <div class="message success">{{ successMessage() }}</div>
        }

        @if (isLoadingZones()) {
          <div class="message">Cargando zonas...</div>
        }

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid two-col">
            <div class="field">
              <label for="firstName">Nombre</label>
              <input id="firstName" type="text" formControlName="firstName" />
            </div>

            <div class="field">
              <label for="lastName">Apellido</label>
              <input id="lastName" type="text" formControlName="lastName" />
            </div>

            <div class="field">
              <label for="phone">Telefono</label>
              <input id="phone" type="text" formControlName="phone" />
            </div>

            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" />
            </div>

            <div class="field">
              <label for="vehicleType">Vehiculo</label>
              <select id="vehicleType" formControlName="vehicleType">
                @for (vehicleType of vehicleTypes; track vehicleType.value) {
                  <option [ngValue]="vehicleType.value">{{ vehicleType.label }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label for="plate">Placa</label>
              <input id="plate" type="text" formControlName="plate" />
            </div>

            <div class="field">
              <label for="zoneId">Zona</label>
              <select id="zoneId" formControlName="zoneId">
                <option value="">Selecciona una zona</option>
                @for (zone of zones(); track zone.id) {
                  <option [value]="zone.id">{{ zone.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="page-actions">
            <button class="button" type="submit" [disabled]="isSubmitting() || isLoadingZones()">
              {{ isSubmitting() ? 'Enviando...' : 'Enviar codigo' }}
            </button>
            <a class="button ghost" routerLink="/login">Volver al login</a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class DriverRegistrationStartPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly zoneApi = inject(ZoneApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly vehicleTypes: VehicleTypeOption[] = [
    { label: 'Motorcycle', value: 0 },
    { label: 'Mototaxi', value: 1 },
    { label: 'Bicycle', value: 2 },
  ];
  readonly zones = signal<ZoneResponse[]>([]);
  readonly isLoadingZones = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    vehicleType: [0 as VehicleType, [Validators.required]],
    plate: ['', [Validators.required]],
    zoneId: ['', [Validators.required]],
  });

  constructor() {
    if (this.authService.hasValidOpsSession()) {
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
      return;
    }

    this.loadZones();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: StartDriverRegistrationRequest = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim(),
      vehicleType: raw.vehicleType,
      plate: raw.plate.trim(),
      zoneId: raw.zoneId,
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authApi
      .startDriverRegistration(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          setRegistrationState('driver', {
            email: response.email || request.email,
            code: '',
            started: true,
            verified: false,
          });
          this.successMessage.set(response.message || 'Te enviamos un codigo a tu correo.');
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/register/driver/verify');
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo iniciar el registro del driver.'));
          this.isSubmitting.set(false);
        },
      });
  }

  private loadZones(): void {
    this.zoneApi
      .getZones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones.filter((zone) => zone.isActive));
          this.isLoadingZones.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar las zonas.'));
          this.isLoadingZones.set(false);
        },
      });
  }
}
