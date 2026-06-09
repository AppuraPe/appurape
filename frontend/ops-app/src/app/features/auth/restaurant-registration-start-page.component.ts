import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StartRestaurantRegistrationRequest } from '../../core/models/restaurant.models';
import { ZoneResponse } from '../../core/models/zone.models';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ZoneApiService } from '../../core/services/zone-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { validateImageFile } from '../../core/utils/file-upload.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { setRegistrationState } from './registration-flow.storage';

@Component({
  selector: 'app-restaurant-registration-start-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppBackButtonComponent, PageHeaderComponent, AppNoticeComponent, AppButtonComponent, AppSurfaceCardComponent],
  template: `
    <section class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto grid w-full max-w-[1040px] gap-3">
        <app-back-button fallbackUrl="/login" label="Volver" />
      </div>
      <div class="mx-auto mt-3 grid w-full max-w-[1040px] gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <app-surface-card variant="soft" extraClass="hidden gap-4 p-4 sm:p-5 lg:grid">
          <div class="grid gap-2">
            <span class="inline-flex w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary-700">
              Paso 1 de 3
            </span>
            <h1 class="text-3xl font-black tracking-[-0.05em] sm:text-[2.2rem]">Tu restaurante empieza aquí</h1>
            <p class="text-sm leading-6 text-text-muted">
              Completa los datos base, sube tu logo y continúa con la verificación del correo.
            </p>
          </div>

          <app-notice
            tone="info"
            title="Registro corto"
            message="Primero registramos el negocio. Luego verificas el correo y creas tu contraseña."
          />
        </app-surface-card>

        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <app-page-header
            eyebrow="Registro"
            title="Registrar restaurante"
            subtitle="Pantalla compacta, sin bloques decorativos y lista para usarse desde el celular."
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
            <div class="grid gap-4 md:grid-cols-2">
              <div class="field">
                <label for="firstName">Nombre</label>
                <input id="firstName" type="text" formControlName="firstName" />
              </div>

              <div class="field">
                <label for="lastName">Apellido</label>
                <input id="lastName" type="text" formControlName="lastName" />
              </div>

              <div class="field">
                <label for="phone">Teléfono</label>
                <input id="phone" type="text" formControlName="phone" />
              </div>

              <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" formControlName="email" />
              </div>

              <div class="field">
                <label for="restaurantName">Nombre del restaurante</label>
                <input id="restaurantName" type="text" formControlName="restaurantName" />
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

              <div class="field">
                <label for="address">Dirección</label>
                <input id="address" type="text" formControlName="address" />
              </div>

              <div class="field">
                <label for="reference">Referencia</label>
                <input id="reference" type="text" formControlName="reference" />
              </div>

              <div class="field">
                <label for="openTime">Hora de apertura</label>
                <input id="openTime" type="time" formControlName="openTime" />
              </div>

              <div class="field">
                <label for="closeTime">Hora de cierre</label>
                <input id="closeTime" type="time" formControlName="closeTime" />
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
              <div class="field">
                <label for="logoFile">Logo del restaurante</label>
                <input id="logoFile" type="file" accept="image/png,image/jpeg,image/webp" (change)="onLogoSelected($event)" />
                @if (logoFileName()) {
                  <small class="muted">Archivo seleccionado: {{ logoFileName() }}</small>
                }
                <small class="upload-note">PNG, JPG o WEBP. Máximo 5 MB.</small>
              </div>

              @if (logoPreviewUrl()) {
                <div class="preview-card">
                  <img class="preview-image h-40" [src]="logoPreviewUrl()" alt="Vista previa del logo" />
                </div>
              } @else {
                <div class="preview-card preview-empty min-h-40">
                  <span>Tu logo aparecerá aquí cuando selecciones un archivo.</span>
                </div>
              }
            </div>

            <div class="field">
              <label for="description">Descripción</label>
              <textarea id="description" rows="4" formControlName="description"></textarea>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <app-button type="submit" [disabled]="isSubmitting() || isLoadingZones()" size="lg" block>
                {{ isSubmitting() ? 'Enviando...' : 'Enviar código' }}
              </app-button>
              <app-button variant="ghost" routerLink="/login" block>Volver al login</app-button>
            </div>
          </form>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class RestaurantRegistrationStartPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly zoneApi = inject(ZoneApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly zones = signal<ZoneResponse[]>([]);
  readonly isLoadingZones = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly logoFileName = signal('');

  private logoObjectUrl: string | null = null;
  private _selectedLogoFile: File | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    restaurantName: ['', [Validators.required]],
    description: ['', [Validators.required]],
    address: ['', [Validators.required]],
    reference: [''],
    zoneId: ['', [Validators.required]],
    openTime: ['', [Validators.required]],
    closeTime: ['', [Validators.required]],
  });

  constructor() {
    if (this.authService.hasValidOpsSession()) {
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
      return;
    }

    this.destroyRef.onDestroy(() => {
      if (this.logoObjectUrl) {
        URL.revokeObjectURL(this.logoObjectUrl);
      }
    });

    this.loadZones();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: StartRestaurantRegistrationRequest = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim(),
      restaurantName: raw.restaurantName.trim(),
      description: raw.description.trim(),
      address: raw.address.trim(),
      reference: raw.reference.trim(),
      zoneId: raw.zoneId,
      openTime: this.toApiTimeValue(raw.openTime),
      closeTime: this.toApiTimeValue(raw.closeTime),
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authApi
      .startRestaurantRegistration(this.buildFormData(raw))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          setRegistrationState('restaurant', {
            email: response.email || request.email,
            code: '',
            started: true,
            verified: false,
          });
          this.successMessage.set(response.message || 'Te enviamos un código a tu correo.');
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/register/restaurant/verify');
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo iniciar el registro del restaurante.'));
          this.isSubmitting.set(false);
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.clearLogoSelection();
      return;
    }

    const fileError = validateImageFile(file, 'El logo');
    if (fileError) {
      this.errorMessage.set(fileError);
      input.value = '';
      this.clearLogoSelection();
      return;
    }

    this.errorMessage.set('');
    this.logoFileName.set(file.name);
    this.replaceLogoPreview(file);
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

  private buildFormData(raw: ReturnType<typeof this.form.getRawValue>): FormData {
    const formData = new FormData();
    formData.append('FirstName', raw.firstName.trim());
    formData.append('LastName', raw.lastName.trim());
    formData.append('Phone', raw.phone.trim());
    formData.append('Email', raw.email.trim());
    formData.append('RestaurantName', raw.restaurantName.trim());
    formData.append('Description', raw.description.trim());
    formData.append('Address', raw.address.trim());
    formData.append('Reference', raw.reference.trim());
    formData.append('ZoneId', raw.zoneId);
    formData.append('OpenTime', this.toApiTimeValue(raw.openTime));
    formData.append('CloseTime', this.toApiTimeValue(raw.closeTime));

    const logoFile = this.selectedLogoFile();
    if (logoFile) {
      formData.append('LogoFile', logoFile, logoFile.name);
    }

    return formData;
  }

  private selectedLogoFile(): File | null {
    return this._selectedLogoFile;
  }

  private replaceLogoPreview(file: File): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
    }

    this._selectedLogoFile = file;
    this.logoObjectUrl = URL.createObjectURL(file);
    this.logoPreviewUrl.set(this.logoObjectUrl);
  }

  private clearLogoSelection(): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = null;
    }

    this._selectedLogoFile = null;
    this.logoFileName.set('');
    this.logoPreviewUrl.set(null);
  }

  private toApiTimeValue(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }
}
