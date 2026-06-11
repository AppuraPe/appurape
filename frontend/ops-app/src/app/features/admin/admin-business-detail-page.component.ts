import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Building2,
  CalendarClock,
  Clock3,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-angular';
import { AdminBusinessDetailResponse, UpdateAdminBusinessStatusAction } from '../../core/models/admin-business.models';
import { AdminBusinessesApiService } from '../../core/services/admin-businesses-api.service';
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
          title="Detalle de restaurante"
          subtitle="Informacion administrativa, branding y control operativo."
        />

        <div class="flex flex-wrap gap-3">
          <app-button variant="ghost" [routerLink]="'/admin/restaurants'">Volver a restaurantes</app-button>
          <app-button variant="secondary" [routerLink]="'/admin/restaurants/pending'">Pendientes</app-button>
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
          <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-text-muted">
            Cargando restaurante...
          </div>
        } @else if (restaurant()) {
          <app-notice
            tone="warning"
            title="Impacto de las acciones"
            message="Approve habilita la operacion, Reject impide operar, Suspend bloquea temporalmente y Reactivate devuelve el acceso si el estado lo permite."
          />

          <div class="stats-grid">
            <app-metric-card label="Aprobacion" [value]="restaurant()!.approvalStatus" helper="Estado administrativo principal" />
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
                  <p class="text-sm text-text-muted">{{ restaurant()!.description || 'Sin descripcion registrada.' }}</p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="buildingIcon" aria-hidden="true"></lucide-angular>
                    Owner
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.ownerFullName }}</p>
                </div>
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mailIcon" aria-hidden="true"></lucide-angular>
                    Email
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.ownerEmail }}</p>
                </div>
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                    Telefono
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.ownerPhone }}</p>
                </div>
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    Zona
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.zoneName }}</p>
                </div>
              </div>

              <div class="rounded-[24px] border border-[#eddad4] bg-white p-4 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                  <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                  Logo
                </div>

                @if (restaurant()!.logoUrl) {
                  <div class="mt-3 overflow-hidden rounded-[20px] border border-[#eddad4] bg-surface-soft">
                    <img class="block h-56 w-full object-cover" [src]="restaurant()!.logoUrl" [alt]="restaurant()!.name" />
                  </div>
                  <div class="mt-3">
                    <a class="font-extrabold text-primary-700 no-underline hover:text-primary-600" [href]="restaurant()!.logoUrl" target="_blank" rel="noreferrer">
                      Abrir logo
                    </a>
                  </div>
                } @else {
                  <div class="mt-3 grid min-h-44 place-items-center rounded-[20px] border border-[#eddad4] bg-surface-soft p-6 text-center text-sm font-semibold text-text-muted">
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
                Operacion
              </div>

              <div class="grid gap-3">
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    Direccion
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.address }}</p>
                  <p class="mt-1 text-sm text-text-muted">{{ restaurant()!.reference || 'Sin referencia registrada.' }}</p>
                </div>

                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                    Horario
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant()!.openTime }} - {{ restaurant()!.closeTime }}</p>
                </div>

                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
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
  private readonly route = inject(ActivatedRoute);
  private readonly adminBusinessesApi = inject(AdminBusinessesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeIcon = Store;
  readonly buildingIcon = Building2;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapPinIcon = MapPin;
  readonly shieldCheckIcon = ShieldCheck;
  readonly calendarIcon = CalendarClock;
  readonly clockIcon = Clock3;

  readonly actions: Array<{ label: string; value: UpdateAdminBusinessStatusAction }> = [
    { label: 'Approve', value: 'approve' },
    { label: 'Reject', value: 'reject' },
    { label: 'Suspend', value: 'suspend' },
    { label: 'Reactivate', value: 'reactivate' },
  ];

  readonly restaurant = signal<AdminBusinessDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly actionInProgress = signal<UpdateAdminBusinessStatusAction | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  private readonly restaurantId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.loadRestaurant();
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
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el restaurante.'));
          this.isLoading.set(false);
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
          this.errorMessage.set(getErrorMessage(error, `No se pudo aplicar la accion ${action}.`));
          this.actionInProgress.set(null);
        },
      });
  }
}

