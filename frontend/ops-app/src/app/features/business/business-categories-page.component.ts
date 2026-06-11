import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FilterX,
  FolderKanban,
  Layers3,
  LucideAngularModule,
  RefreshCw,
  Search,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import {
  CatalogCategoryResponse,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
} from '../../core/models/business.model';
import { MyCatalogApiService } from '../../core/services/my-catalog-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-business-categories-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    ReactiveFormsModule,
    LucideAngularModule,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Menu"
          title="Categorias"
          subtitle="Crea y edita categorias para ordenar mejor el catalogo del negocio."
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

        <div class="stats-grid">
          <app-metric-card label="Categorias" [value]="categories().length" helper="Resultados visibles en la lista" />
          <app-metric-card label="Activas" [value]="activeCategoriesCount()" helper="Disponibles para mostrar productos" />
          <app-metric-card label="Modo" [value]="editingCategory() ? 'Edicion' : 'Creacion'" helper="Estado actual del formulario" />
        </div>
      </app-surface-card>

      <div class="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <app-surface-card variant="page">
          <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="folderIcon" aria-hidden="true"></lucide-angular>
              {{ editingCategory() ? 'Editar categoria' : 'Nueva categoria' }}
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Nombre</span>
                <input id="categoryName" type="text" formControlName="name" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">SortOrder</span>
                <input id="categorySortOrder" type="number" min="0" formControlName="sortOrder" />
              </label>
            </div>

            @if (editingCategory()) {
              <label class="flex items-center gap-3 rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-loreto-carbon">
                <input type="checkbox" formControlName="isActive" />
                <span>Categoria activa</span>
              </label>
            }

            <div class="flex flex-wrap gap-3">
              <app-button size="lg" type="submit" [disabled]="isSubmitting()">
                {{
                  isSubmitting()
                    ? (editingCategory() ? 'Guardando...' : 'Creando...')
                    : (editingCategory() ? 'Guardar cambios' : 'Crear')
                }}
              </app-button>
              @if (editingCategory()) {
                <app-button variant="secondary" size="lg" type="button" (click)="cancelEdit()" [disabled]="isSubmitting()">
                  Cancelar
                </app-button>
              }
              <app-button variant="ghost" size="lg" type="button" (click)="loadCategories()" [disabled]="isLoading() || isSubmitting()">
                <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                Recargar
              </app-button>
            </div>
          </form>
        </app-surface-card>

        <app-surface-card variant="page">
          <app-page-header
            eyebrow="Lista"
            title="Categorias actuales"
            subtitle="Selecciona una categoria para editarla o revisa su estado."
          />

          <form class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]" [formGroup]="filtersForm" (ngSubmit)="loadCategories()">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Buscar categoria</span>
              <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
                <input
                  id="categorySearch"
                  type="search"
                  formControlName="q"
                  placeholder="Buscar por nombre"
                  autocomplete="off"
                  class="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
                />
              </div>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Estado</span>
              <select id="categoryActiveFilter" formControlName="isActive">
                <option value="">Todas</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </label>

            <div class="flex flex-wrap items-end gap-3 xl:justify-end">
              <app-button type="submit" [disabled]="isLoading()">
                <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
                Aplicar
              </app-button>
              <app-button variant="ghost" type="button" (click)="clearFilters()" [disabled]="isLoading()">
                <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
                Limpiar
              </app-button>
            </div>
          </form>

          @if (isLoading()) {
            <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-text-muted">
              Cargando categorias...
            </div>
          } @else if (!categories().length) {
            <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-4 text-sm font-semibold text-text-muted">
              No hay categorias para los filtros seleccionados.
            </div>
          } @else {
            <div class="grid gap-4">
              @for (category of categories(); track category.id) {
                <app-surface-card variant="page">
                  <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div class="grid gap-2">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ category.name }}</strong>
                      <span class="text-sm text-text-muted">SortOrder: {{ category.sortOrder }}</span>
                    </div>

                    <div class="flex flex-wrap items-center gap-3 xl:justify-end">
                      <app-status-badge [status]="category.isActive" [label]="category.isActive ? 'Activa' : 'Inactiva'" />
                      <app-button variant="secondary" size="lg" type="button" (click)="startEdit(category)" [disabled]="isSubmitting()">
                        Editar
                      </app-button>
                    </div>
                  </div>

                  @if (!category.isActive) {
                    <app-notice
                      tone="warning"
                      title="Categoria inactiva"
                      message="Los productos dentro de una categoria inactiva pueden quedar fuera de la experiencia publica."
                    />
                  }
                </app-surface-card>
              }
            </div>
          }
        </app-surface-card>
      </div>
    </section>
  `,
})
export class BusinessCategoriesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myCatalogApi = inject(MyCatalogApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly folderIcon = FolderKanban;
  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly refreshIcon = RefreshCw;
  readonly layersIcon = Layers3;

  readonly categories = signal<CatalogCategoryResponse[]>([]);
  readonly editingCategory = signal<CatalogCategoryResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    isActive: [''],
  });

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadCategories();
    });

    this.loadCategories();
  }

  activeCategoriesCount(): number {
    return this.categories().filter((category) => category.isActive).length;
  }

  loadCategories(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.myCatalogApi
      .getCategories({
        q: filters.q,
        isActive: this.toOptionalBoolean(filters.isActive),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set([...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar las categorias.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
        isActive: '',
      },
      { emitEvent: false },
    );
    this.loadCategories();
  }

  startEdit(category: CatalogCategoryResponse): void {
    this.editingCategory.set(category);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.form.setValue({
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  }

  cancelEdit(): void {
    this.editingCategory.set(null);
    this.form.reset({
      name: '',
      sortOrder: 0,
      isActive: true,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const editingCategory = this.editingCategory();
    const raw = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (editingCategory) {
      const request: UpdateCatalogCategoryRequest = {
        name: raw.name.trim(),
        sortOrder: raw.sortOrder,
        isActive: raw.isActive,
      };

      this.myCatalogApi
        .updateCategory(editingCategory.id, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.successMessage.set('Categoria actualizada correctamente.');
            this.isSubmitting.set(false);
            this.cancelEdit();
            this.loadCategories();
          },
          error: (error) => {
            this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la categoria.'));
            this.isSubmitting.set(false);
          },
        });

      return;
    }

    const request: CreateCatalogCategoryRequest = {
      name: raw.name.trim(),
      sortOrder: raw.sortOrder,
    };

    this.myCatalogApi
      .createCategory(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Categoria creada correctamente.');
          this.isSubmitting.set(false);
          this.cancelEdit();
          this.loadCategories();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo crear la categoria.'));
          this.isSubmitting.set(false);
        },
      });
  }

  private toOptionalBoolean(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return null;
  }
}

