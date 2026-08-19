import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ImagePlus, LucideAngularModule, RefreshCw, Store } from 'lucide-angular';
import { MyBusinessResponse } from '../../core/models/business.model';
import { MyBusinessApiService } from '../../core/services/my-business-api.service';
import { validateImageFile } from '../../core/utils/file-upload.utils';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { ProfileModeSwitcherCardComponent } from '../../shared/components/profile-mode-switcher-card.component';

@Component({
  selector: 'app-business-profile-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AppButtonComponent,
    AppSurfaceCardComponent,
    ProfileModeSwitcherCardComponent,
  ],
  templateUrl: './business-profile-page.component.html',
})
export class BusinessProfilePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myBusinessApi = inject(MyBusinessApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeIcon = Store;
  readonly imagePlusIcon = ImagePlus;
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
    hasOwnDelivery: [false],
    ownDeliveryFee: [0, [Validators.min(0)]],
    ownDeliveryNote: [''],
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
            hasOwnDelivery: restaurant.hasOwnDelivery,
            ownDeliveryFee: restaurant.ownDeliveryFee ?? 0,
            ownDeliveryNote: restaurant.ownDeliveryNote ?? '',
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
    formData.append('HasOwnDelivery', String(raw.hasOwnDelivery));
    formData.append('OwnDeliveryFee', raw.hasOwnDelivery ? String(raw.ownDeliveryFee ?? 0) : '');
    formData.append('OwnDeliveryNote', raw.hasOwnDelivery ? raw.ownDeliveryNote.trim() : '');

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
            hasOwnDelivery: updatedRestaurant.hasOwnDelivery,
            ownDeliveryFee: updatedRestaurant.ownDeliveryFee ?? 0,
            ownDeliveryNote: updatedRestaurant.ownDeliveryNote ?? '',
          });
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el perfil del negocio.'));
          this.isSaving.set(false);
        },
      });
  }

  approvalStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'En revisión';
      case 'Approved':
        return 'Aprobado';
      case 'Rejected':
        return 'Rechazado';
      case 'Suspended':
        return 'Suspendido';
      default:
        return 'Por revisar';
    }
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
