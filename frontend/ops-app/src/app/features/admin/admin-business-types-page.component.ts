import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ArrowUpDown,
  BadgeCheck,
  LucideAngularModule,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shapes,
  Tags,
  ToggleLeft,
  ToggleRight,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { AdminBusinessTypeResponse, UpsertAdminBusinessTypeRequest } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-business-types-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden lg:gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="Admin"
          title="Categorías de negocios"
          subtitle="Gestiona las categorías disponibles para exploración y registro."
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

        <app-notice
          tone="info"
          title="Gestión segura"
          message="No existe eliminación física. Solo puedes crear, editar y activar o desactivar categorías."
        />

        <div class="stats-grid">
          <app-metric-card label="Categorías" [value]="businessTypes().length" helper="Total configurado" />
          <app-metric-card label="Activas" [value]="activeCount()" helper="Disponibles para nuevos registros" />
          <app-metric-card label="Negocios" [value]="businessCount()" helper="Asociaciones acumuladas" />
          <app-metric-card label="Resultados" [value]="filteredBusinessTypes().length" helper="Filtrados por nombre" />
        </div>
      </app-surface-card>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <app-surface-card variant="page" extraClass="h-fit">
          <div class="grid gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="grid gap-1">
                <span class="text-xs font-black uppercase tracking-[0.18em] text-primary-700">
                  {{ editingBusinessTypeId() ? 'Editar categoría' : 'Nueva categoría' }}
                </span>
                <p class="text-sm text-text-muted">Configura nombre, slug, icono y orden desde el panel administrativo.</p>
              </div>
              @if (editingBusinessTypeId()) {
                <app-button type="button" variant="ghost" size="sm" (click)="startCreate()">Nueva</app-button>
              }
            </div>

            <form class="grid gap-4" [formGroup]="form" (ngSubmit)="save()">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Nombre</span>
                <input id="name" type="text" formControlName="name" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Slug</span>
                <input id="slug" type="text" formControlName="slug" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Icono</span>
                <input id="iconKey" type="text" formControlName="iconKey" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Orden</span>
                <input id="sortOrder" type="number" min="0" formControlName="sortOrder" />
              </label>

              <div class="flex flex-wrap gap-3">
                <app-button type="submit" size="md" [disabled]="isSaving() || isLoading()">
                  <lucide-angular class="h-4 w-4" [img]="plusIcon" aria-hidden="true"></lucide-angular>
                  {{ isSaving() ? 'Guardando...' : editingBusinessTypeId() ? 'Guardar cambios' : 'Crear categoría' }}
                </app-button>
                <app-button type="button" variant="ghost" size="md" [disabled]="isSaving()" (click)="startCreate()">
                  Limpiar
                </app-button>
              </div>
            </form>
          </div>
        </app-surface-card>

        <div class="grid gap-4">
          <app-surface-card variant="page" extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Buscar por nombre</span>
                <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/15">
                  <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
                  <input
                    id="businessTypeSearch"
                    type="search"
                    [formControl]="searchControl"
                    placeholder="Busca por nombre"
                    autocomplete="off"
                    class="min-h-0 w-full border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
                  />
                </div>
              </label>

              <div class="flex flex-wrap items-end gap-3 lg:justify-end">
                <app-button type="button" variant="ghost" [disabled]="isLoading()" (click)="loadBusinessTypes()">
                  <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                  Recargar
                </app-button>
              </div>
            </div>
          </app-surface-card>

          @if (isLoading()) {
            <div class="rounded-[28px] border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
              Cargando categorías...
            </div>
          } @else if (!filteredBusinessTypes().length) {
            <app-surface-card variant="page">
              <div class="grid gap-4">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                  No hay categorías que coincidan con la búsqueda actual.
                </div>
                <div class="flex flex-wrap gap-3">
                  <app-button size="md" type="button" (click)="clearSearch()">Limpiar búsqueda</app-button>
                  <app-button variant="ghost" [routerLink]="'/admin/dashboard'">Volver al inicio</app-button>
                </div>
              </div>
            </app-surface-card>
          } @else {
            <div class="hidden xl:block">
              <app-surface-card variant="page" extraClass="overflow-hidden p-0">
                <div class="overflow-hidden rounded-[28px]">
                  <table class="w-full border-collapse">
                    <thead class="bg-surface-soft">
                      <tr class="text-left text-xs font-black uppercase tracking-[0.16em] text-primary-700">
                        <th class="px-4 py-4">Nombre</th>
                        <th class="px-4 py-4">Slug</th>
                        <th class="px-4 py-4">Icono</th>
                        <th class="px-4 py-4">Orden</th>
                        <th class="px-4 py-4">Estado</th>
                        <th class="px-4 py-4">Negocios</th>
                        <th class="px-4 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (businessType of filteredBusinessTypes(); track businessType.id) {
                        <tr class="border-t border-slate-100 align-top">
                          <td class="px-4 py-4">
                            <strong class="text-base font-black text-loreto-carbon">{{ businessType.name }}</strong>
                          </td>
                          <td class="px-4 py-4 text-sm font-semibold text-text-muted">{{ businessType.slug }}</td>
                          <td class="px-4 py-4 text-sm font-semibold text-text-muted">{{ businessType.iconKey || 'Sin icono' }}</td>
                          <td class="px-4 py-4 text-sm font-semibold text-loreto-carbon">{{ businessType.sortOrder }}</td>
                          <td class="px-4 py-4">
                            <app-status-badge [status]="businessType.isActive" [label]="businessType.isActive ? 'Activa' : 'Inactiva'" />
                          </td>
                          <td class="px-4 py-4 text-sm font-semibold text-loreto-carbon">{{ businessType.businessCount }}</td>
                          <td class="px-4 py-4">
                            <div class="flex flex-wrap justify-end gap-2">
                              <app-button type="button" variant="secondary" size="sm" (click)="startEdit(businessType)">
                                <lucide-angular class="h-4 w-4" [img]="editIcon" aria-hidden="true"></lucide-angular>
                                Editar
                              </app-button>
                              <app-button
                                type="button"
                                [variant]="businessType.isActive ? 'ghost' : 'primary'"
                                size="sm"
                                [disabled]="isTogglingId() === businessType.id"
                                (click)="toggleStatus(businessType)"
                              >
                                <lucide-angular class="h-4 w-4" [img]="businessType.isActive ? toggleLeftIcon : toggleRightIcon" aria-hidden="true"></lucide-angular>
                                {{ isTogglingId() === businessType.id ? 'Procesando...' : businessType.isActive ? 'Desactivar' : 'Activar' }}
                              </app-button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </app-surface-card>
            </div>

            <div class="grid gap-4 xl:hidden">
              @for (businessType of filteredBusinessTypes(); track businessType.id) {
                <app-surface-card variant="page">
                  <div class="grid gap-4">
                    <div class="flex items-start gap-4">
                      <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                        <lucide-angular class="h-6 w-6" [img]="tagsIcon" aria-hidden="true"></lucide-angular>
                      </div>
                      <div class="min-w-0 grid gap-1">
                        <strong class="truncate text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ businessType.name }}</strong>
                        <span class="break-all text-sm text-text-muted">Slug: {{ businessType.slug }}</span>
                        <span class="text-sm text-text-muted">Icono: {{ businessType.iconKey || 'Sin icono' }}</span>
                      </div>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-3">
                      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                          <lucide-angular class="h-4 w-4" [img]="sortIcon" aria-hidden="true"></lucide-angular>
                          Orden
                        </div>
                        <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ businessType.sortOrder }}</p>
                      </div>
                      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                          <lucide-angular class="h-4 w-4" [img]="businessIcon" aria-hidden="true"></lucide-angular>
                          Negocios
                        </div>
                        <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ businessType.businessCount }}</p>
                      </div>
                      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                          <lucide-angular class="h-4 w-4" [img]="statusIcon" aria-hidden="true"></lucide-angular>
                          Estado
                        </div>
                        <div class="mt-2">
                          <app-status-badge [status]="businessType.isActive" [label]="businessType.isActive ? 'Activa' : 'Inactiva'" />
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <app-button type="button" variant="secondary" size="md" (click)="startEdit(businessType)">
                        <lucide-angular class="h-4 w-4" [img]="editIcon" aria-hidden="true"></lucide-angular>
                        Editar
                      </app-button>
                      <app-button
                        type="button"
                        [variant]="businessType.isActive ? 'ghost' : 'primary'"
                        size="md"
                        [disabled]="isTogglingId() === businessType.id"
                        (click)="toggleStatus(businessType)"
                      >
                        <lucide-angular class="h-4 w-4" [img]="businessType.isActive ? toggleLeftIcon : toggleRightIcon" aria-hidden="true"></lucide-angular>
                        {{ isTogglingId() === businessType.id ? 'Procesando...' : businessType.isActive ? 'Desactivar' : 'Activar' }}
                      </app-button>
                    </div>
                  </div>
                </app-surface-card>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class AdminBusinessTypesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly businessIcon = Shapes;
  readonly tagsIcon = Tags;
  readonly searchIcon = Search;
  readonly refreshIcon = RefreshCw;
  readonly plusIcon = Plus;
  readonly editIcon = Pencil;
  readonly toggleLeftIcon = ToggleLeft;
  readonly toggleRightIcon = ToggleRight;
  readonly sortIcon = ArrowUpDown;
  readonly statusIcon = BadgeCheck;

  readonly businessTypes = signal<AdminBusinessTypeResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isTogglingId = signal<string | null>(null);
  readonly editingBusinessTypeId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly searchTerm = signal('');
  readonly activeCount = computed(() => this.businessTypes().filter((item) => item.isActive).length);
  readonly businessCount = computed(() => this.businessTypes().reduce((sum, item) => sum + item.businessCount, 0));
  readonly filteredBusinessTypes = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.businessTypes();
    }

    return this.businessTypes().filter((item) => item.name.toLowerCase().includes(query));
  });

  readonly searchControl = this.formBuilder.nonNullable.control('');
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    iconKey: [''],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.searchTerm.set(value.trim());
    });

    this.loadBusinessTypes();
  }

  loadBusinessTypes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getBusinessTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (businessTypes) => {
          this.businessTypes.set([...businessTypes].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar las categorías de negocios.'));
          this.isLoading.set(false);
        },
      });
  }

  startCreate(): void {
    this.editingBusinessTypeId.set(null);
    this.form.reset(
      {
        name: '',
        slug: '',
        iconKey: '',
        sortOrder: 0,
      },
      { emitEvent: false },
    );
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  startEdit(businessType: AdminBusinessTypeResponse): void {
    this.editingBusinessTypeId.set(businessType.id);
    this.form.setValue({
      name: businessType.name,
      slug: businessType.slug,
      iconKey: businessType.iconKey ?? '',
      sortOrder: businessType.sortOrder,
    });
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: UpsertAdminBusinessTypeRequest = {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      iconKey: raw.iconKey.trim() || null,
      sortOrder: raw.sortOrder,
    };

    const editingId = this.editingBusinessTypeId();
    const operation = editingId
      ? this.adminApi.updateBusinessType(editingId, request)
      : this.adminApi.createBusinessType(request);

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (businessType) => {
        this.isSaving.set(false);
        this.startCreate();
        this.successMessage.set(editingId ? `Se actualizó ${businessType.name}.` : `Se creó ${businessType.name}.`);
        this.loadBusinessTypes();
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudo guardar la categoría de negocio.'));
        this.isSaving.set(false);
      },
    });
  }

  toggleStatus(businessType: AdminBusinessTypeResponse): void {
    this.isTogglingId.set(businessType.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminApi
      .updateBusinessTypeStatus(businessType.id, { isActive: !businessType.isActive })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedBusinessType) => {
          this.successMessage.set(updatedBusinessType.isActive ? `Se activó ${updatedBusinessType.name}.` : `Se desactivó ${updatedBusinessType.name}.`);
          this.isTogglingId.set(null);
          this.loadBusinessTypes();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar ${businessType.name}.`));
          this.isTogglingId.set(null);
        },
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: true });
  }
}
