import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Clock3,
  ImagePlus,
  LucideAngularModule,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-angular';
import { MyBusinessResponse } from '../../core/models/business.model';
import { MyBusinessApiService } from '../../core/services/my-business-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { validateImageFile } from '../../core/utils/file-upload.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-business-profile-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    ReactiveFormsModule,
    LucideAngularModule,
    AppNoticeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Business"
          title="Perfil del negocio"
          subtitle="Actualiza la cara publica del negocio con una interfaz mas clara y moderna."
        />

        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {{ successMessage() }}
          </div>
        }

        @if (isLoading()) {
          <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-text-muted">
            Cargando perfil...
          </div>
        } @else if (restaurant()) {
          @if (restaurant()!.approvalStatus === 'Pending') {
            <app-notice
              tone="warning"
              title="Pendiente de aprobacion"
              message="Tu negocio aun no aparece al publico porque sigue pendiente de aprobacion administrativa."
            />
          }

          @if (restaurant()!.approvalStatus === 'Approved' && restaurant()!.isActive) {
            <app-notice
              tone="success"
              title="Visible para operar"
              message="Tu negocio esta aprobado y activo. Mantener perfil, horario y catalogo actualizados ayuda a evitar pedidos incorrectos."
            />
          }

          @if (!restaurant()!.isActive || restaurant()!.approvalStatus === 'Rejected') {
            <app-notice
              tone="danger"
              title="No disponible al publico"
              message="Tu negocio no puede recibir pedidos mientras este inactivo, rechazado o suspendido."
            />
          }

          <div class="stats-grid">
            <app-metric-card label="Zona" [value]="restaurant()!.zoneName" helper="Cobertura operativa actual" />
            <app-metric-card label="Estado" [value]="restaurant()!.isActive ? 'Activo' : 'Inactivo'" helper="Visibilidad operativa" />
            <app-metric-card label="Aprobacion" [value]="restaurant()!.approvalStatus" helper="Control administrativo" />
          </div>
        }
      </app-surface-card>

      @if (restaurant()) {
        <div class="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <app-surface-card variant="page">
            <div class="grid gap-5">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="grid gap-1">
                  <h2 class="mb-0 text-2xl font-black tracking-[-0.03em] text-loreto-carbon">{{ restaurant()!.name }}</h2>
                  <p class="text-sm text-text-muted">{{ restaurant()!.description }}</p>
                </div>
              </div>

              @if (logoPreviewUrl()) {
                <div class="overflow-hidden rounded-[24px] border border-[#eddad4] bg-surface-soft">
                  <img class="block h-64 w-full object-cover" [src]="logoPreviewUrl()" alt="Logo del negocio" />
                </div>
              } @else {
                <div class="grid min-h-56 place-items-center rounded-[24px] border border-dashed border-[#d9c0b8] bg-surface-soft p-6 text-center text-sm font-semibold text-text-muted">
                  El logo del negocio aparecera aqui.
                </div>
              }

              <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                  <lucide-angular class="h-4 w-4" [img]="imagePlusIcon" aria-hidden="true"></lucide-angular>
                  Identidad visual
                </div>
                <p class="mt-3 text-sm leading-6 text-text-muted">
                  Un logo claro y una descripcion precisa hacen que el negocio inspire mas confianza cuando el cliente lo encuentra por primera vez.
                </p>
              </div>
            </div>
          </app-surface-card>

          <app-surface-card variant="page">
            <form class="grid gap-4" [formGroup]="form" (ngSubmit)="save()">
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-loreto-carbon">Nombre</span>
                  <input id="name" type="text" formControlName="name" />
                </label>

                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-loreto-carbon">Logo</span>
                  <input id="logoFile" type="file" accept="image/png,image/jpeg,image/webp" (change)="onLogoSelected($event)" />
                  @if (logoFileName()) {
                    <small class="text-sm text-text-muted">Archivo seleccionado: {{ logoFileName() }}</small>
                  }
                  <small class="text-sm text-text-muted">PNG, JPG o WEBP. Maximo 5 MB.</small>
                </label>

                <label class="grid gap-2 sm:col-span-2">
                  <span class="text-sm font-semibold text-loreto-carbon">Direccion</span>
                  <input id="address" type="text" formControlName="address" />
                </label>

                <label class="grid gap-2 sm:col-span-2">
                  <span class="text-sm font-semibold text-loreto-carbon">Referencia</span>
                  <input id="reference" type="text" formControlName="reference" />
                </label>

                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-loreto-carbon">Hora apertura</span>
                  <input id="openTime" type="time" formControlName="openTime" />
                </label>

                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-loreto-carbon">Hora cierre</span>
                  <input id="closeTime" type="time" formControlName="closeTime" />
                </label>
              </div>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Descripcion</span>
                <textarea id="description" rows="4" formControlName="description"></textarea>
              </label>

              <input type="hidden" formControlName="logoUrl" />

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    Zona
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.zoneName }}</p>
                </div>
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                    Aprobacion
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.approvalStatus }}</p>
                </div>
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                    Horario
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.openTime }} - {{ restaurant()!.closeTime }}</p>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <app-button size="lg" type="submit" [disabled]="isSaving()">
                  {{ isSaving() ? 'Guardando...' : 'Guardar cambios' }}
                </app-button>
                <app-button variant="ghost" size="lg" type="button" [disabled]="isSaving()" (click)="loadProfile()">
                  <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                  Recargar
                </app-button>
              </div>
            </form>
          </app-surface-card>
        </div>
      }
    </section>
  `,
})
export class BusinessProfilePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myBusinessApi = inject(MyBusinessApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeIcon = Store;
  readonly imagePlusIcon = ImagePlus;
  readonly mapPinIcon = MapPin;
  readonly shieldCheckIcon = ShieldCheck;
  readonly clockIcon = Clock3;
  readonly refreshIcon = RefreshCw;

  readonly restaurant = signal<MyBusinessResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly logoFileName = signal('');

  private logoFile: File | null = null;
  private logoObjectUrl: string | null = null;

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
    this.destroyRef.onDestroy(() => {
      if (this.logoObjectUrl) {
        URL.revokeObjectURL(this.logoObjectUrl);
      }
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.logoFile = null;
    this.logoFileName.set('');
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = null;
    }

    this.myBusinessApi
      .getMyBusiness()
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
          this.logoPreviewUrl.set(restaurant.logoUrl ?? null);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el perfil del negocio.'));
          this.isLoading.set(false);
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
    this.logoFile = file;
    this.logoFileName.set(file.name);
    this.replaceLogoPreview(file);
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
    const formData = new FormData();
    formData.append('Name', raw.name.trim());
    formData.append('Description', raw.description.trim());
    formData.append('Address', raw.address.trim());
    formData.append('Reference', raw.reference.trim());
    formData.append('ZoneId', restaurant.zoneId);
    formData.append('OpenTime', this.toApiTimeValue(raw.openTime));
    formData.append('CloseTime', this.toApiTimeValue(raw.closeTime));
    formData.append('LogoUrl', raw.logoUrl.trim());

    if (this.logoFile) {
      formData.append('LogoFile', this.logoFile, this.logoFile.name);
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.myBusinessApi
      .updateMyBusiness(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedRestaurant) => {
          this.restaurant.set(updatedRestaurant);
          this.successMessage.set('Perfil actualizado correctamente.');
          this.isSaving.set(false);
          this.logoFile = null;
          this.logoFileName.set('');
          if (this.logoObjectUrl) {
            URL.revokeObjectURL(this.logoObjectUrl);
            this.logoObjectUrl = null;
          }
          this.logoPreviewUrl.set(updatedRestaurant.logoUrl ?? null);
          this.form.patchValue({
            openTime: this.toTimeInputValue(updatedRestaurant.openTime),
            closeTime: this.toTimeInputValue(updatedRestaurant.closeTime),
            logoUrl: updatedRestaurant.logoUrl ?? '',
          });
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el perfil del negocio.'));
          this.isSaving.set(false);
        },
      });
  }

  private replaceLogoPreview(file: File): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
    }

    this.logoObjectUrl = URL.createObjectURL(file);
    this.logoPreviewUrl.set(this.logoObjectUrl);
  }

  private clearLogoSelection(): void {
    this.logoFile = null;
    this.logoFileName.set('');
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = null;
    }

    this.logoPreviewUrl.set(this.restaurant()?.logoUrl ?? null);
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

