import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VehicleType, VehicleTypeOption } from '../../core/models/driver.models';
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
  selector: 'app-driver-registration-start-page',
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
            <h1 class="text-3xl font-black tracking-[-0.05em] sm:text-[2.2rem]">Activa tu cuenta de driver</h1>
            <p class="text-sm leading-6 text-text-muted">
              Registra tus datos y tus archivos en una vista simple, pensada para subir todo desde el celular.
            </p>
          </div>

          <app-notice
            tone="info"
            title="Flujo compacto"
            message="Primero tus datos de reparto, luego verificas el correo y al final creas la contraseña."
          />
        </app-surface-card>

        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <app-page-header
            eyebrow="Registro"
            title="Registrar driver"
            subtitle="Menos ruido visual y mejor manejo de archivos largos en pantallas pequeñas."
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
                <input id="phone" type="tel" inputmode="tel" placeholder="999999999" formControlName="phone" />
                @if (form.controls.phone.invalid && form.controls.phone.touched) {
                  <small class="text-sm font-medium text-danger">Ingresa un celular peruano válido de 9 dígitos.</small>
                }
              </div>

              <div class="field">
                <label for="identityDocumentNumber">DNI</label>
                <input id="identityDocumentNumber" type="text" inputmode="numeric" maxlength="8" placeholder="12345678" formControlName="identityDocumentNumber" />
                @if (form.controls.identityDocumentNumber.invalid && form.controls.identityDocumentNumber.touched) {
                  <small class="text-sm font-medium text-danger">Ingresa un DNI válido de 8 dígitos.</small>
                }
              </div>

              <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" formControlName="email" />
              </div>

              <div class="field">
                <label for="vehicleType">Vehículo</label>
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

              <div class="field md:col-span-2">
                <label for="zoneId">Zona</label>
                <select id="zoneId" formControlName="zoneId">
                  <option value="">Selecciona una zona</option>
                  @for (zone of zones(); track zone.id) {
                    <option [value]="zone.id">{{ zone.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="field">
                <label for="identityDocumentFile">Documento de identidad</label>
                <input id="identityDocumentFile" type="file" accept="image/png,image/jpeg,image/webp" (change)="onIdentityDocumentSelected($event)" />
                @if (identityDocumentFileName()) {
                  <small class="muted">Archivo seleccionado: {{ identityDocumentFileName() }}</small>
                }
                <small class="upload-note">PNG, JPG o WEBP. Máximo 5 MB.</small>
              </div>

              <div class="field">
                <label for="vehiclePhotoFile">Foto del vehículo</label>
                <input id="vehiclePhotoFile" type="file" accept="image/png,image/jpeg,image/webp" (change)="onVehiclePhotoSelected($event)" />
                @if (vehiclePhotoFileName()) {
                  <small class="muted">Archivo seleccionado: {{ vehiclePhotoFileName() }}</small>
                }
                <small class="upload-note">PNG, JPG o WEBP. Máximo 5 MB.</small>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              @if (identityDocumentPreviewUrl()) {
                <div class="preview-card">
                  <img class="preview-image h-44" [src]="identityDocumentPreviewUrl()" alt="Vista previa del documento" />
                </div>
              } @else {
                <div class="preview-card preview-empty min-h-44">
                  <span>El documento se verá aquí después de elegir un archivo.</span>
                </div>
              }

              @if (vehiclePhotoPreviewUrl()) {
                <div class="preview-card">
                  <img class="preview-image h-44" [src]="vehiclePhotoPreviewUrl()" alt="Vista previa del vehículo" />
                </div>
              } @else {
                <div class="preview-card preview-empty min-h-44">
                  <span>La foto del vehículo se verá aquí después de elegir un archivo.</span>
                </div>
              }
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
  readonly identityDocumentPreviewUrl = signal<string | null>(null);
  readonly identityDocumentFileName = signal('');
  readonly vehiclePhotoPreviewUrl = signal<string | null>(null);
  readonly vehiclePhotoFileName = signal('');

  private identityDocumentObjectUrl: string | null = null;
  private vehiclePhotoObjectUrl: string | null = null;
  private identityDocumentFile: File | null = null;
  private vehiclePhotoFile: File | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+?51)?9\d{8}$/)]],
    identityDocumentNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
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

    this.destroyRef.onDestroy(() => {
      if (this.identityDocumentObjectUrl) {
        URL.revokeObjectURL(this.identityDocumentObjectUrl);
      }

      if (this.vehiclePhotoObjectUrl) {
        URL.revokeObjectURL(this.vehiclePhotoObjectUrl);
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

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authApi
      .startDriverRegistration(this.buildFormData(raw))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          setRegistrationState('driver', {
            email: response.email || raw.email.trim(),
            code: '',
            started: true,
            verified: false,
          });
          this.successMessage.set(response.message || 'Te enviamos un código a tu correo.');
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/register/driver/verify');
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo iniciar el registro del driver.'));
          this.isSubmitting.set(false);
        },
      });
  }

  onIdentityDocumentSelected(event: Event): void {
    this.handleFileSelection(event, 'Documento de identidad', 'identity');
  }

  onVehiclePhotoSelected(event: Event): void {
    this.handleFileSelection(event, 'Foto del vehículo', 'vehicle');
  }

  private handleFileSelection(event: Event, label: string, target: 'identity' | 'vehicle'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.clearFileSelection(target);
      return;
    }

    const fileError = validateImageFile(file, label);
    if (fileError) {
      this.errorMessage.set(fileError);
      input.value = '';
      this.clearFileSelection(target);
      return;
    }

    this.errorMessage.set('');

    if (target === 'identity') {
      this.identityDocumentFile = file;
      this.identityDocumentFileName.set(file.name);
      this.replacePreview('identity', file);
      return;
    }

    this.vehiclePhotoFile = file;
    this.vehiclePhotoFileName.set(file.name);
    this.replacePreview('vehicle', file);
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
    formData.append('IdentityDocumentNumber', raw.identityDocumentNumber.trim());
    formData.append('Email', raw.email.trim());
    formData.append('VehicleType', String(raw.vehicleType));
    formData.append('Plate', raw.plate.trim());
    formData.append('ZoneId', raw.zoneId);

    if (this.identityDocumentFile) {
      formData.append('IdentityDocumentFile', this.identityDocumentFile, this.identityDocumentFile.name);
    }

    if (this.vehiclePhotoFile) {
      formData.append('VehiclePhotoFile', this.vehiclePhotoFile, this.vehiclePhotoFile.name);
    }

    return formData;
  }

  private replacePreview(target: 'identity' | 'vehicle', file: File): void {
    if (target === 'identity') {
      if (this.identityDocumentObjectUrl) {
        URL.revokeObjectURL(this.identityDocumentObjectUrl);
      }

      this.identityDocumentObjectUrl = URL.createObjectURL(file);
      this.identityDocumentPreviewUrl.set(this.identityDocumentObjectUrl);
      return;
    }

    if (this.vehiclePhotoObjectUrl) {
      URL.revokeObjectURL(this.vehiclePhotoObjectUrl);
    }

    this.vehiclePhotoObjectUrl = URL.createObjectURL(file);
    this.vehiclePhotoPreviewUrl.set(this.vehiclePhotoObjectUrl);
  }

  private clearFileSelection(target: 'identity' | 'vehicle'): void {
    if (target === 'identity') {
      this.identityDocumentFile = null;
      this.identityDocumentFileName.set('');
      if (this.identityDocumentObjectUrl) {
        URL.revokeObjectURL(this.identityDocumentObjectUrl);
        this.identityDocumentObjectUrl = null;
      }
      this.identityDocumentPreviewUrl.set(null);
      return;
    }

    this.vehiclePhotoFile = null;
    this.vehiclePhotoFileName.set('');
    if (this.vehiclePhotoObjectUrl) {
      URL.revokeObjectURL(this.vehiclePhotoObjectUrl);
      this.vehiclePhotoObjectUrl = null;
    }
    this.vehiclePhotoPreviewUrl.set(null);
  }
}
