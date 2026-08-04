import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Building2,
  CalendarClock,
  Clock3,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-angular';
import { BusinessTypeListItemResponse } from '../../core/models/businesses.models';
import { AdminBusinessDetailResponse, UpdateAdminBusinessStatusAction } from '../../core/models/admin-business.models';
import { AdminBusinessesApiService } from '../../core/services/admin-businesses-api.service';
import { BusinessesApiService } from '../../core/services/businesses-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-admin-business-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AppNoticeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Admin"
          title="Detalle de negocio"
          subtitle="Información administrativa, branding y control operativo."
        />

        <div class="flex flex-wrap gap-3">
          <app-button variant="ghost" [routerLink]="'/admin/businesses'">Volver a negocios</app-button>
          <app-button variant="secondary" [routerLink]="'/admin/businesses/pending'">Pendientes</app-button>
        </div>

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
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            Cargando negocio...
          </div>
        } @else if (restaurant()) {
          <app-notice
            tone="warning"
            title="Impacto de las acciones"
            message="Approve habilita la operación, Reject impide operar, Suspend bloquea temporalmente y Reactivate devuelve el acceso si el estado lo permite."
          />

          <div class="stats-grid">
            <app-metric-card label="Aprobación" [value]="restaurant()!.approvalStatus" helper="Estado administrativo principal" />
            <app-metric-card label="Activo" [value]="restaurant()!.isActive ? 'Activo' : 'Inactivo'" helper="Disponibilidad operativa" />
            <app-metric-card label="Usuario" [value]="restaurant()!.userStatus" helper="Estado de la cuenta propietaria" />
          </div>

          <div class="flex flex-wrap gap-3">
            @for (action of actions; track action.value) {
              <app-button
                [variant]="action.value === 'reject' || action.value === 'suspend' ? 'danger' : 'primary'"
                size="lg"
                type="button"
                [disabled]="actionInProgress() === action.value"
                (click)="updateStatus(action.value)"
              >
                {{ actionInProgress() === action.value ? 'Procesando...' : action.label }}
              </app-button>
            }
          </div>
        }
      </app-surface-card>

      @if (restaurant()) {
        <div class="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <app-surface-card variant="page">
            <div class="grid gap-5">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="grid gap-1">
                  <h2 class="mb-0 text-2xl font-black tracking-[-0.03em] text-loreto-carbon">{{ restaurant()!.name }}</h2>
                  <p class="text-sm text-text-muted">{{ restaurant()!.description || 'Sin descripción registrada.' }}</p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="buildingIcon" aria-hidden="true"></lucide-angular>
                    Owner
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.ownerFullName }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mailIcon" aria-hidden="true"></lucide-angular>
                    Email
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.ownerEmail }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                    Teléfono
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.ownerPhone }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                    Categoría
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.businessTypeName || 'Sin categoría' }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    Zona
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.zoneName }}</p>
                </div>
              </div>

              <div class="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                  <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                  Logo
                </div>

                @if (restaurant()!.logoUrl) {
                  <div class="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                    <img class="block h-56 w-full object-cover" [src]="restaurant()!.logoUrl" [alt]="restaurant()!.name" />
                  </div>
                  <div class="mt-3">
                    <a class="font-extrabold text-primary-700 no-underline hover:text-primary-600" [href]="restaurant()!.logoUrl" target="_blank" rel="noreferrer">
                      Abrir logo
                    </a>
                  </div>
                } @else {
                  <div class="mt-3 grid min-h-44 place-items-center rounded-[20px] border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                    Sin logo cargado.
                  </div>
                }
              </div>
            </div>
          </app-surface-card>

          <app-surface-card variant="page">
            <div class="grid gap-4">
              <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
                <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                Operación
              </div>

              <div class="grid gap-3">
                <form class="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm" [formGroup]="businessTypeForm" (ngSubmit)="updateBusinessType()">
                  <div class="grid gap-3">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div class="grid gap-1">
                        <span class="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Categoría del negocio</span>
                        <p class="text-sm text-text-muted">Solo se permiten categorías activas como nueva selección.</p>
                      </div>
                      <app-button type="button" variant="ghost" size="sm" [disabled]="isLoadingBusinessTypes()" (click)="loadBusinessTypes()">
                        <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                        Recargar
                      </app-button>
                    </div>

                    @if (isLoadingBusinessTypes()) {
                      <div class="text-sm font-semibold text-text-muted">Cargando categorías...</div>
                    } @else {
                      <label class="grid gap-2">
                        <span class="text-sm font-semibold text-loreto-carbon">Tipo de negocio</span>
                        <select id="businessTypeId" formControlName="businessTypeId" class="min-h-12 w-full">
                          <option value="">Selecciona una categoría</option>
                          @for (businessType of businessTypes(); track businessType.id) {
                            <option [value]="businessType.id">{{ businessType.name }}</option>
                          }
                        </select>
                      </label>
                    }

                    <div class="flex flex-wrap gap-3">
                      <app-button type="submit" size="md" [disabled]="isSavingBusinessType() || isLoadingBusinessTypes() || businessTypeForm.invalid">
                        {{ isSavingBusinessType() ? 'Guardando...' : 'Guardar categoría' }}
                      </app-button>
                    </div>
                  </div>
                </form>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    Dirección
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.address }}</p>
                  <p class="mt-1 text-sm text-text-muted">{{ restaurant()!.reference || 'Sin referencia registrada.' }}</p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                    Horario
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.openTime }} - {{ restaurant()!.closeTime }}</p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="calendarIcon" aria-hidden="true"></lucide-angular>
                    Trazabilidad
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">Creado: {{ restaurant()!.createdAtUtc | date: 'medium' }}</p>
                  <p class="mt-1 text-sm text-text-muted">Actualizado: {{ restaurant()!.updatedAtUtc ? (restaurant()!.updatedAtUtc | date: 'medium') : 'Sin cambios' }}</p>
                </div>
              </div>
            </div>
          </app-surface-card>
        </div>
      }
    </section>
  `,
})
export class AdminBusinessDetailPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly adminBusinessesApi = inject(AdminBusinessesApiService);
  private readonly businessesApi = inject(BusinessesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeIcon = Store;
  readonly buildingIcon = Building2;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapPinIcon = MapPin;
  readonly shieldCheckIcon = ShieldCheck;
  readonly calendarIcon = CalendarClock;
  readonly clockIcon = Clock3;
  readonly refreshIcon = RefreshCw;

  readonly actions: Array<{ label: string; value: UpdateAdminBusinessStatusAction }> = [
    { label: 'Approve', value: 'approve' },
    { label: 'Reject', value: 'reject' },
    { label: 'Suspend', value: 'suspend' },
    { label: 'Reactivate', value: 'reactivate' },
  ];

  readonly restaurant = signal<AdminBusinessDetailResponse | null>(null);
  readonly businessTypes = signal<BusinessTypeListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingBusinessTypes = signal(true);
  readonly isSavingBusinessType = signal(false);
  readonly actionInProgress = signal<UpdateAdminBusinessStatusAction | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly businessTypeForm = this.formBuilder.nonNullable.group({
    businessTypeId: ['', [Validators.required]],
  });

  private readonly restaurantId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.loadRestaurant();
    this.loadBusinessTypes();
  }

  loadRestaurant(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminBusinessesApi
      .getBusinessById(this.restaurantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurant) => {
          this.restaurant.set(restaurant);
          this.businessTypeForm.patchValue({
            businessTypeId: restaurant.businessTypeId ?? '',
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el negocio.'));
          this.isLoading.set(false);
        },
      });
  }

  loadBusinessTypes(): void {
    this.isLoadingBusinessTypes.set(true);

    this.businessesApi
      .getBusinessTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (businessTypes) => {
          this.businessTypes.set(businessTypes);
          this.isLoadingBusinessTypes.set(false);
        },
        error: () => {
          this.isLoadingBusinessTypes.set(false);
        },
      });
  }

  updateStatus(action: UpdateAdminBusinessStatusAction): void {
    this.actionInProgress.set(action);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminBusinessesApi
      .updateBusinessStatus(this.restaurantId, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurant) => {
          this.restaurant.set(restaurant);
          this.successMessage.set(`Accion ${action} aplicada correctamente.`);
          this.actionInProgress.set(null);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo aplicar la acción ${action}.`));
          this.actionInProgress.set(null);
        },
      });
  }

  updateBusinessType(): void {
    if (this.businessTypeForm.invalid) {
      this.businessTypeForm.markAllAsTouched();
      return;
    }

    const raw = this.businessTypeForm.getRawValue();
    this.isSavingBusinessType.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminBusinessesApi
      .updateBusinessType(this.restaurantId, { businessTypeId: raw.businessTypeId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurant) => {
          this.restaurant.set(restaurant);
          this.businessTypeForm.patchValue({
            businessTypeId: restaurant.businessTypeId ?? '',
          });
          this.successMessage.set('Categoría actualizada correctamente.');
          this.isSavingBusinessType.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la categoría del negocio.'));
          this.isSavingBusinessType.set(false);
        },
      });
  }
}

