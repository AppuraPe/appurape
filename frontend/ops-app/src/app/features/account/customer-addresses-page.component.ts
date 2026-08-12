import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessZoneListItemResponse } from '../../core/models/businesses.models';
import { CustomerAddressResponse, UpsertCustomerAddressRequest } from '../../core/models/customer-addresses.models';
import { CustomerAddressesApiService } from '../../core/services/customer-addresses-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ZonesApiService } from '../../core/services/zones-api.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-customer-addresses-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MobilePageShellComponent,
    AppBackButtonComponent,
    InternalPageSectionHeaderComponent,
    AppSurfaceCardComponent,
    AppButtonComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
  ],
  templateUrl: './customer-addresses-page.component.html',
})
export class CustomerAddressesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly customerAddressesApi = inject(CustomerAddressesApiService);
  private readonly zonesApi = inject(ZonesApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly addresses = signal<CustomerAddressResponse[]>([]);
  readonly zones = signal<BusinessZoneListItemResponse[]>([]);
  readonly isLoadingAddresses = signal(true);
  readonly isLoadingZones = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly zonesErrorMessage = signal('');
  readonly editingAddressId = signal<string | null>(null);
  readonly pendingDeleteAddressId = signal<string | null>(null);
  readonly deletingAddressId = signal<string | null>(null);
  readonly successMessage = signal('');
  readonly isFormOpen = signal(false);

  readonly isEditing = computed(() => !!this.editingAddressId());
  readonly isDeleting = computed(() => !!this.deletingAddressId());
  readonly pageSubtitle = computed(() =>
    this.addresses().length
      ? 'Guarda varias direcciones, elige una predeterminada y reutilízala en checkout.'
      : 'Guarda tu primera dirección para acelerar el checkout sin perder la opción manual.',
  );

  readonly addressForm = this.formBuilder.nonNullable.group({
    label: ['Casa', [Validators.required, Validators.maxLength(80)]],
    recipientName: ['', [Validators.required, Validators.maxLength(150)]],
    recipientPhone: ['', [Validators.required, Validators.maxLength(30)]],
    addressLine: ['', [Validators.required, Validators.maxLength(300)]],
    reference: ['', [Validators.required, Validators.maxLength(300)]],
    zoneId: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const shouldDisableForm = this.isSaving() || this.isLoadingZones() || this.isDeleting();
      if (shouldDisableForm) {
        this.addressForm.disable({ emitEvent: false });
        return;
      }

      this.addressForm.enable({ emitEvent: false });
    });

    this.loadAddresses();
    this.loadZones();
  }

  submit(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const request = this.buildRequest();
    const editingAddressId = this.editingAddressId();
    this.isSaving.set(true);
    this.successMessage.set('');

    const request$ = editingAddressId
      ? this.customerAddressesApi.updateMyAddress(editingAddressId, request)
      : this.customerAddressesApi.createMyAddress(request);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (address) => {
        this.isSaving.set(false);
        this.upsertAddress(address);
        this.resetForm();
        this.isFormOpen.set(false);
        this.successMessage.set(editingAddressId ? 'Dirección actualizada correctamente.' : 'Dirección creada correctamente.');
        this.notificationService.success(this.successMessage());
      },
      error: (error) => {
        this.isSaving.set(false);
        const message = getApiErrorMessage(error, 'No pudimos guardar la dirección. Intenta nuevamente.');
        this.errorMessage.set(message);
        this.notificationService.error(message);
      },
    });
  }

  editAddress(address: CustomerAddressResponse): void {
    this.isFormOpen.set(true);
    this.editingAddressId.set(address.id);
    this.pendingDeleteAddressId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.addressForm.reset({
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      addressLine: address.addressLine,
      reference: address.reference,
      zoneId: address.zoneId,
    });
    queueMicrotask(() => document.getElementById('address-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  cancelEdit(): void {
    this.resetForm();
    this.isFormOpen.set(false);
  }

  openCreateForm(): void {
    this.resetForm();
    this.isFormOpen.set(true);
    queueMicrotask(() => document.getElementById('address-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  setDefault(address: CustomerAddressResponse): void {
    if (address.isDefault || this.deletingAddressId()) {
      return;
    }

    this.customerAddressesApi.setDefault(address.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedAddress) => {
        this.addresses.set(
          this.addresses()
            .map((item) => ({ ...item, isDefault: item.id === updatedAddress.id }))
            .sort(this.sortAddresses),
        );
        this.pendingDeleteAddressId.set(null);
        this.successMessage.set('Dirección predeterminada actualizada.');
        this.notificationService.success(this.successMessage());
      },
      error: (error) => {
        const message = getApiErrorMessage(error, 'No pudimos marcar la dirección como predeterminada.');
        this.errorMessage.set(message);
        this.notificationService.error(message);
      },
    });
  }

  requestDeleteAddress(address: CustomerAddressResponse): void {
    this.pendingDeleteAddressId.set(this.pendingDeleteAddressId() === address.id ? null : address.id);
  }

  cancelDeleteAddress(): void {
    this.pendingDeleteAddressId.set(null);
  }

  deleteAddress(address: CustomerAddressResponse): void {
    if (this.deletingAddressId()) {
      return;
    }

    this.deletingAddressId.set(address.id);
    this.customerAddressesApi.deleteMyAddress(address.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pendingDeleteAddressId.set(null);
        this.deletingAddressId.set(null);

        if (this.editingAddressId() === address.id) {
          this.resetForm();
        }

        this.loadAddresses();
        this.successMessage.set('Dirección eliminada correctamente.');
        this.notificationService.success(this.successMessage());
      },
      error: (error) => {
        this.deletingAddressId.set(null);
        const message = getApiErrorMessage(error, 'No pudimos eliminar la dirección.');
        this.errorMessage.set(message);
        this.notificationService.error(message);
      },
    });
  }

  private loadAddresses(): void {
    this.isLoadingAddresses.set(true);
    this.errorMessage.set('');

    this.customerAddressesApi.getMyAddresses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses.sort(this.sortAddresses));
        this.isFormOpen.set(addresses.length === 0);
        this.isLoadingAddresses.set(false);
      },
      error: (error) => {
        this.isLoadingAddresses.set(false);
        const message = this.getAddressLoadErrorMessage(error);
        this.errorMessage.set(message);
        this.notificationService.error(message);
      },
    });
  }

  private getAddressLoadErrorMessage(error: unknown): string {
    const status = (error as { status?: number } | null)?.status;
    if (status === 401) {
      return 'Tu sesión ha vencido. Inicia sesión nuevamente para ver tus direcciones.';
    }

    if (status === 403) {
      return 'No tienes permiso para ver estas direcciones. Ingresa con una cuenta de cliente.';
    }

    return getApiErrorMessage(error, 'No pudimos cargar tus direcciones. Intenta nuevamente.');
  }

  private loadZones(): void {
    this.isLoadingZones.set(true);
    this.zonesErrorMessage.set('');

    this.zonesApi.getZones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (zones) => {
        this.zones.set(zones);
        this.isLoadingZones.set(false);
      },
      error: (error) => {
        this.isLoadingZones.set(false);
        this.zonesErrorMessage.set(getApiErrorMessage(error, 'No pudimos cargar las zonas.'));
      },
    });
  }

  private upsertAddress(address: CustomerAddressResponse): void {
    const nextAddresses = this.addresses().filter((item) => item.id !== address.id);
    nextAddresses.push(address);
    this.addresses.set(nextAddresses.sort(this.sortAddresses));
  }

  private resetForm(): void {
    this.editingAddressId.set(null);
    this.pendingDeleteAddressId.set(null);
    this.addressForm.reset({
      label: 'Casa',
      recipientName: '',
      recipientPhone: '',
      addressLine: '',
      reference: '',
      zoneId: '',
    });
  }

  private buildRequest(): UpsertCustomerAddressRequest {
    const raw = this.addressForm.getRawValue();
    return {
      label: raw.label.trim(),
      recipientName: raw.recipientName.trim(),
      recipientPhone: raw.recipientPhone.trim(),
      addressLine: raw.addressLine.trim(),
      reference: raw.reference.trim(),
      zoneId: raw.zoneId,
    };
  }

  private readonly sortAddresses = (left: CustomerAddressResponse, right: CustomerAddressResponse): number => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }

    return new Date(right.updatedAtUtc ?? right.createdAtUtc).getTime() - new Date(left.updatedAtUtc ?? left.createdAtUtc).getTime();
  };
}
