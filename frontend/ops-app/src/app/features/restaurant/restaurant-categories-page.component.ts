import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import {
  CreateMenuCategoryRequest,
  MenuCategoryResponse,
  UpdateMenuCategoryRequest,
} from '../../core/models/restaurant.models';
import { MyMenuApiService } from '../../core/services/my-menu-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-restaurant-categories-page',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="grid">
      <div class="page-card">
        <app-page-header
          eyebrow="Menu"
          title="Categorias"
          subtitle="Crea y edita categorias. Una categoria inactiva ayuda a ocultar grupos de productos sin borrar informacion."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        }

        @if (successMessage()) {
          <div class="message success">{{ successMessage() }}</div>
        }

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid two-col">
            <div class="field">
              <label for="categoryName">Nombre</label>
              <input id="categoryName" type="text" formControlName="name" />
            </div>

            <div class="field">
              <label for="categorySortOrder">SortOrder</label>
              <input id="categorySortOrder" type="number" min="0" formControlName="sortOrder" />
            </div>
          </div>

          @if (editingCategory()) {
            <label class="checkbox-field">
              <input type="checkbox" formControlName="isActive" />
              <span>Categoria activa</span>
            </label>
          }

          <div class="page-actions">
            <button class="button primary-action" type="submit" [disabled]="isSubmitting()">
              {{
                isSubmitting()
                  ? (editingCategory() ? 'Guardando...' : 'Creando...')
                  : (editingCategory() ? 'Guardar cambios' : 'Crear')
              }}
            </button>
            @if (editingCategory()) {
              <button class="button secondary" type="button" (click)="cancelEdit()" [disabled]="isSubmitting()">
                Cancelar
              </button>
            }
            <button class="button ghost" type="button" (click)="loadCategories()" [disabled]="isLoading() || isSubmitting()">
              Recargar
            </button>
          </div>
        </form>
      </div>

      <div class="page-card">
        <app-page-header
          eyebrow="Lista"
          title="Categorias actuales"
          subtitle="Selecciona una categoria para editarla."
        />

        <form class="filters-grid" [formGroup]="filtersForm" (ngSubmit)="loadCategories()">
          <div class="field search-field">
            <label for="categorySearch">Buscar categoria</label>
            <input
              id="categorySearch"
              type="search"
              formControlName="q"
              placeholder="Buscar por nombre"
              autocomplete="off"
            />
          </div>

          <div class="field">
            <label for="categoryActiveFilter">Estado</label>
            <select id="categoryActiveFilter" formControlName="isActive">
              <option value="">Todas</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>

          <div class="page-actions compact">
            <button class="button" type="submit" [disabled]="isLoading()">Aplicar</button>
            <button class="button ghost" type="button" (click)="clearFilters()" [disabled]="isLoading()">Limpiar</button>
          </div>
        </form>

        @if (isLoading()) {
          <div class="message">Cargando categorias...</div>
        } @else if (!categories().length) {
          <div class="message">No hay categorias para los filtros seleccionados.</div>
        } @else {
          <div class="list">
            @for (category of categories(); track category.id) {
              <article class="page-card">
                <div class="split">
                  <div class="stack">
                    <strong>{{ category.name }}</strong>
                    <span class="muted">SortOrder: {{ category.sortOrder }}</span>
                  </div>

                  <div class="stack align-end">
                    <app-status-badge [status]="category.isActive" [label]="category.isActive ? 'Activa' : 'Inactiva'" />
                    <button class="button secondary primary-action" type="button" (click)="startEdit(category)" [disabled]="isSubmitting()">
                      Editar
                    </button>
                  </div>
                </div>
                @if (!category.isActive) {
                  <app-notice
                    tone="warning"
                    title="Categoria inactiva"
                    message="Los productos dentro de una categoria inactiva pueden quedar fuera de la experiencia publica."
                  />
                }
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class RestaurantCategoriesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myMenuApi = inject(MyMenuApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<MenuCategoryResponse[]>([]);
  readonly editingCategory = signal<MenuCategoryResponse | null>(null);
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

  loadCategories(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.myMenuApi
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

  startEdit(category: MenuCategoryResponse): void {
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
      const request: UpdateMenuCategoryRequest = {
        name: raw.name.trim(),
        sortOrder: raw.sortOrder,
        isActive: raw.isActive,
      };

      this.myMenuApi
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

    const request: CreateMenuCategoryRequest = {
      name: raw.name.trim(),
      sortOrder: raw.sortOrder,
    };

    this.myMenuApi
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
