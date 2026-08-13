import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminPlatformSettingsApiService } from '../../core/services/admin-platform-settings-api.service';
import { PlatformSettingsApiService } from '../../core/services/platform-settings-api.service';
import { PlatformSettingsResponse } from '../../core/models/platform-settings.models';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-admin-branding-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppNoticeComponent, AppButtonComponent, AppSurfaceCardComponent, PageHeaderComponent],
  template: `
    <section class="grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="Admin"
          title="Marca global"
          subtitle="Gestiona logo, icono, splash y datos principales de la app."
        />

        <app-notice
          tone="info"
          title="Nota sobre mobile"
          message="Los assets aquí sirven para web y como fuente de branding. Cambiar iconos ya instalados en Android o iOS puede requerir una nueva build nativa."
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

        <form class="grid w-full min-w-0 gap-5" [formGroup]="form" (ngSubmit)="save()">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span class="text-sm font-bold text-loreto-carbon">Nombre de la app</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" type="text" formControlName="appName" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-bold text-loreto-carbon">Tagline</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" type="text" formControlName="tagline" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-bold text-loreto-carbon">Color primario</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" type="text" formControlName="primaryColor" placeholder="#F97316" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-bold text-loreto-carbon">Color secundario</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" type="text" formControlName="secondaryColor" placeholder="#FF7A1A" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-bold text-loreto-carbon">Email de soporte</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" type="email" formControlName="supportEmail" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-bold text-loreto-carbon">Teléfono de soporte</span>
              <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20" type="text" formControlName="supportPhone" />
            </label>
            <label class="grid gap-2"><span class="text-sm font-bold text-loreto-carbon">Razón social</span><input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" type="text" formControlName="legalEntityName" /></label>
            <label class="grid gap-2"><span class="text-sm font-bold text-loreto-carbon">Email de privacidad</span><input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" type="email" formControlName="privacyEmail" /></label>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 class="m-0 text-base font-black text-loreto-carbon">Logo principal</h3>
              <div class="mt-3 grid min-h-40 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                @if (logoPreviewUrl()) {
                  <img class="h-40 w-full object-cover" [src]="logoPreviewUrl()!" alt="Logo principal" />
                } @else {
                  <span class="text-sm font-semibold text-text-muted">Sin logo</span>
                }
              </div>
              <input class="mt-3 block w-full min-w-0 max-w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" (change)="onFileSelected($event, 'logo')" />
            </div>

            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 class="m-0 text-base font-black text-loreto-carbon">Icono / favicon</h3>
              <div class="mt-3 grid min-h-40 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                @if (appIconPreviewUrl()) {
                  <img class="h-28 w-28 rounded-3xl object-cover" [src]="appIconPreviewUrl()!" alt="Icono de la app" />
                } @else {
                  <span class="text-sm font-semibold text-text-muted">Sin icono</span>
                }
              </div>
              <input class="mt-3 block w-full min-w-0 max-w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" (change)="onFileSelected($event, 'appIcon')" />
            </div>

            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 class="m-0 text-base font-black text-loreto-carbon">Splash / hero</h3>
              <div class="mt-3 grid min-h-40 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                @if (splashPreviewUrl()) {
                  <img class="h-40 w-full object-cover" [src]="splashPreviewUrl()!" alt="Splash de la app" />
                } @else {
                  <span class="text-sm font-semibold text-text-muted">Sin splash</span>
                }
              </div>
              <input class="mt-3 block w-full min-w-0 max-w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp" (change)="onFileSelected($event, 'splash')" />
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <app-button type="submit" [disabled]="isSaving() || form.invalid">
              {{ isSaving() ? 'Guardando...' : 'Guardar branding' }}
            </app-button>
            <app-button variant="secondary" routerLink="/admin/dashboard">Volver</app-button>
          </div>
        </form>
      </app-surface-card>
    </section>
  `,
})
export class AdminBrandingPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminPlatformSettingsApi = inject(AdminPlatformSettingsApiService);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentSettings = signal<PlatformSettingsResponse | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly appIconPreviewUrl = signal<string | null>(null);
  readonly splashPreviewUrl = signal<string | null>(null);

  private logoFile: File | null = null;
  private appIconFile: File | null = null;
  private splashFile: File | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    appName: ['AppuraPe', [Validators.required, Validators.maxLength(120)]],
    tagline: [''],
    primaryColor: [''],
    secondaryColor: [''],
    supportEmail: [''],
    supportPhone: [''],
    legalEntityName: [''],
    privacyEmail: ['', Validators.email],
  });

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    this.adminPlatformSettingsApi
      .getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.currentSettings.set(settings);
          this.form.patchValue({
            appName: settings.appName,
            tagline: settings.tagline ?? '',
            primaryColor: settings.primaryColor ?? '',
            secondaryColor: settings.secondaryColor ?? '',
            supportEmail: settings.supportEmail ?? '',
            supportPhone: settings.supportPhone ?? '',
            legalEntityName: settings.legalEntityName ?? '',
            privacyEmail: settings.privacyEmail ?? '',
          });
          this.logoPreviewUrl.set(settings.logoUrl);
          this.appIconPreviewUrl.set(settings.appIconUrl);
          this.splashPreviewUrl.set(settings.splashImageUrl);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el branding global.'));
        },
      });
  }

  onFileSelected(event: Event, type: 'logo' | 'appIcon' | 'splash'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (type === 'logo') {
      this.logoFile = file;
      this.logoPreviewUrl.set(objectUrl);
      return;
    }

    if (type === 'appIcon') {
      this.appIconFile = file;
      this.appIconPreviewUrl.set(objectUrl);
      return;
    }

    this.splashFile = file;
    this.splashPreviewUrl.set(objectUrl);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentSettings = this.currentSettings();
    const formData = new FormData();
    formData.append('AppName', this.form.controls.appName.value.trim());
    formData.append('Tagline', this.form.controls.tagline.value.trim());
    formData.append('PrimaryColor', this.form.controls.primaryColor.value.trim());
    formData.append('SecondaryColor', this.form.controls.secondaryColor.value.trim());
    formData.append('SupportEmail', this.form.controls.supportEmail.value.trim());
    formData.append('SupportPhone', this.form.controls.supportPhone.value.trim());
    formData.append('LegalEntityName', this.form.controls.legalEntityName.value.trim());
    formData.append('PrivacyEmail', this.form.controls.privacyEmail.value.trim());
    formData.append('LogoUrl', currentSettings?.logoUrl ?? '');
    formData.append('AppIconUrl', currentSettings?.appIconUrl ?? '');
    formData.append('SplashImageUrl', currentSettings?.splashImageUrl ?? '');

    if (this.logoFile) {
      formData.append('LogoFile', this.logoFile, this.logoFile.name);
    }

    if (this.appIconFile) {
      formData.append('AppIconFile', this.appIconFile, this.appIconFile.name);
    }

    if (this.splashFile) {
      formData.append('SplashImageFile', this.splashFile, this.splashFile.name);
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminPlatformSettingsApi
      .updateSettings(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (settings) => {
          this.currentSettings.set(settings);
          this.logoFile = null;
          this.appIconFile = null;
          this.splashFile = null;
          this.logoPreviewUrl.set(settings.logoUrl);
          this.appIconPreviewUrl.set(settings.appIconUrl);
          this.splashPreviewUrl.set(settings.splashImageUrl);
          this.successMessage.set('Marca global actualizada correctamente.');
          this.isSaving.set(false);
          await this.platformSettingsApi.refresh();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo guardar el branding global.'));
          this.isSaving.set(false);
        },
      });
  }
}
