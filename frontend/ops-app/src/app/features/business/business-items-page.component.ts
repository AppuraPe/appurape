import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FilterX,
  ImagePlus,
  Layers3,
  LucideAngularModule,
  PackageSearch,
  RefreshCw,
  Search,
  Tags,
} from 'lucide-angular';
import { debounceTime, forkJoin } from 'rxjs';
import {
  CatalogCategoryResponse,
  CatalogItemResponse,
} from '../../core/models/business.model';
import { MyCatalogApiService } from '../../core/services/my-catalog-api.service';
import { validateImageFile } from '../../core/utils/file-upload.utils';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-business-items-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    CurrencyPipe,
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
          title="Productos"
          subtitle="Crea, edita y controla disponibilidad de productos desde una sola vista."
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

        @if (!categories().length && !isLoading()) {
          <app-notice
            tone="warning"
            title="Primero crea una categoría"
            message="No puedes publicar productos si no existe al menos una categoría activa para organizarlos."
          />
        }

        <div class="stats-grid">
          <app-metric-card label="Productos" [value]="items().length" helper="Resultados visibles en la lista" />
          <app-metric-card label="Categorías" [value]="categories().length" helper="Opciones para clasificar el menú" />
          <app-metric-card label="Modo" [value]="editingItem() ? 'Edición' : 'Creación'" helper="Estado actual del formulario" />
        </div>
      </app-surface-card>

      <div class="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <app-surface-card variant="page">
          <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="packageIcon" aria-hidden="true"></lucide-angular>
              {{ editingItem() ? 'Editar producto' : 'Nuevo producto' }}
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Categoría</span>
                <select id="itemCategoryId" formControlName="categoryId">
                  <option value="">Selecciona una categoría</option>
                  @for (category of categories(); track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Nombre</span>
                <input id="itemName" type="text" formControlName="name" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Precio</span>
                <input id="itemPrice" type="number" min="0.01" step="0.01" formControlName="price" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-loreto-carbon">Imagen</span>
                <input id="itemImageFile" type="file" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
                @if (imageFileName()) {
                  <small class="text-sm text-text-muted">Archivo seleccionado: {{ imageFileName() }}</small>
                }
                <small class="text-sm text-text-muted">PNG, JPG o WEBP. Maximo 5 MB.</small>
              </label>
            </div>

            @if (imagePreviewUrl()) {
              <div class="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                <img class="block h-64 w-full object-cover" [src]="imagePreviewUrl()" alt="Vista previa del producto" />
              </div>
            } @else {
              <div class="grid min-h-56 place-items-center rounded-[24px] border border-dashed border-[#d9c0b8] bg-surface-soft p-6 text-center text-sm font-semibold text-text-muted">
                La imagen del producto aparecerá aquí.
              </div>
            }

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Descripción</span>
              <textarea id="itemDescription" rows="4" formControlName="description"></textarea>
            </label>

            @if (editingItem()) {
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">
                  <input type="checkbox" formControlName="isAvailable" />
                  <span>Disponible</span>
                </label>

                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">
                  <input type="checkbox" formControlName="isActive" />
                  <span>Activo</span>
                </label>
              </div>
            }

            <div class="flex flex-wrap gap-3">
              <app-button size="lg" type="submit" [disabled]="isSubmitting() || !categories().length">
                {{
                  isSubmitting()
                    ? (editingItem() ? 'Guardando...' : 'Creando...')
                    : (editingItem() ? 'Guardar cambios' : 'Crear')
                }}
              </app-button>
              @if (editingItem()) {
                <app-button variant="secondary" size="lg" type="button" (click)="cancelEdit()" [disabled]="isSubmitting()">
                  Cancelar
                </app-button>
              }
              <app-button variant="ghost" size="lg" type="button" (click)="reloadData()" [disabled]="isLoading() || isSubmitting()">
                <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                Recargar
              </app-button>
            </div>

            <input type="hidden" formControlName="imageUrl" />
          </form>
        </app-surface-card>

        <app-surface-card variant="page">
          <app-page-header
            eyebrow="Lista"
            title="Productos actuales"
            subtitle="Selecciona un producto para editarlo o ajusta su disponibilidad."
          />

          <form class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,0.8fr))_auto]" [formGroup]="filtersForm" (ngSubmit)="loadItems()">
            <label class="grid gap-2 xl:col-span-2">
              <span class="text-sm font-semibold text-loreto-carbon">Buscar producto</span>
              <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/15">
                <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
                <input
                  id="itemSearch"
                  type="search"
                  formControlName="q"
                  placeholder="Nombre, descripción o categoría"
                  autocomplete="off"
                  class="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
                />
              </div>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Categoría</span>
              <select id="itemCategoryFilter" formControlName="categoryId">
                <option value="">Todas</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Estado</span>
              <select id="itemActiveFilter" formControlName="isActive">
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Disponibilidad</span>
              <select id="itemAvailabilityFilter" formControlName="isAvailable">
                <option value="">Todos</option>
                <option value="true">Disponibles</option>
                <option value="false">No disponibles</option>
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
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              Cargando productos...
            </div>
          } @else if (!items().length) {
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
              No hay productos para los filtros seleccionados.
            </div>
          } @else {
            <div class="grid gap-4">
              @for (item of items(); track item.id) {
                <app-surface-card variant="page">
                  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div class="grid gap-3">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ item.name }}</strong>
                      <span class="text-sm text-text-muted">Categoría: {{ item.categoryName }}</span>
                      <span class="text-sm text-text-muted">{{ item.description }}</span>
                      <span class="text-sm font-semibold text-loreto-carbon">Precio: {{ item.price | currency: 'PEN' : 'symbol' : '1.2-2' }}</span>
                    </div>

                    <div class="grid gap-3 xl:justify-items-end">
                      <div class="flex flex-wrap items-center gap-2">
                        <app-status-badge [status]="item.isAvailable" [label]="item.isAvailable ? 'Disponible' : 'No disponible'" />
                        <app-status-badge [status]="item.isActive" [label]="item.isActive ? 'Activo' : 'Inactivo'" />
                      </div>

                      <div class="flex flex-wrap gap-3 xl:justify-end">
                        <app-button variant="secondary" size="lg" type="button" (click)="startEdit(item)" [disabled]="isSubmitting()">
                          Editar
                        </app-button>
                        <app-button
                          variant="ghost"
                          size="lg"
                          type="button"
                          (click)="toggleAvailability(item)"
                          [disabled]="availabilityItemId() === item.id"
                        >
                          {{
                            availabilityItemId() === item.id
                              ? 'Actualizando...'
                              : (item.isAvailable ? 'Marcar no disponible' : 'Marcar disponible')
                          }}
                        </app-button>
                      </div>
                    </div>
                  </div>

                  @if (!item.isAvailable || !item.isActive) {
                    <app-notice
                      tone="warning"
                      title="Producto oculto o limitado"
                      message="Este producto no se muestra al público si está inactivo o marcado como no disponible."
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
export class BusinessItemsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myCatalogApi = inject(MyCatalogApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly packageIcon = PackageSearch;
  readonly imagePlusIcon = ImagePlus;
  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly refreshIcon = RefreshCw;
  readonly tagsIcon = Tags;
  readonly layersIcon = Layers3;

  readonly categories = signal<CatalogCategoryResponse[]>([]);
  readonly items = signal<CatalogItemResponse[]>([]);
  readonly editingItem = signal<CatalogItemResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly availabilityItemId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageFileName = signal('');

  private imageFile: File | null = null;
  private imageObjectUrl: string | null = null;

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    categoryId: [''],
    isActive: [''],
    isAvailable: [''],
  });

  readonly form = this.formBuilder.nonNullable.group({
    categoryId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    imageUrl: [''],
    isAvailable: [true],
    isActive: [true],
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.imageObjectUrl) {
        URL.revokeObjectURL(this.imageObjectUrl);
      }
    });

    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadItems();
    });

    this.reloadData();
  }

  reloadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      categories: this.myCatalogApi.getCategories(),
      items: this.myCatalogApi.getItems(this.buildItemFilters()),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, items }) => {
          this.categories.set([...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
          this.items.set([...items].sort((a, b) => a.name.localeCompare(b.name)));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar productos y categorías.'));
          this.isLoading.set(false);
        },
      });
  }

  loadItems(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.myCatalogApi
      .getItems(this.buildItemFilters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set([...items].sort((a, b) => a.name.localeCompare(b.name)));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los productos.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
        categoryId: '',
        isActive: '',
        isAvailable: '',
      },
      { emitEvent: false },
    );
    this.loadItems();
  }

  startEdit(item: CatalogItemResponse): void {
    this.editingItem.set(item);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.imageFile = null;
    this.imageFileName.set('');
    this.clearImagePreview();
    this.form.setValue({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
      isActive: item.isActive,
    });
    this.imagePreviewUrl.set(item.imageUrl ?? null);
  }

  cancelEdit(): void {
    this.editingItem.set(null);
    this.imageFile = null;
    this.imageFileName.set('');
    this.clearImagePreview();
    this.form.reset({
      categoryId: '',
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      isAvailable: true,
      isActive: true,
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.clearSelectedImage();
      return;
    }

    const fileError = validateImageFile(file, 'La imagen');
    if (fileError) {
      this.errorMessage.set(fileError);
      input.value = '';
      this.clearSelectedImage();
      return;
    }

    this.errorMessage.set('');
    this.imageFile = file;
    this.imageFileName.set(file.name);
    this.replaceImagePreview(file);
  }

  submit(): void {
    if (this.form.invalid || !this.categories().length) {
      this.form.markAllAsTouched();
      return;
    }

    const editingItem = this.editingItem();
    const raw = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (editingItem) {
      const request = this.buildUpdateFormData(raw);
      this.myCatalogApi
        .updateItem(editingItem.id, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.successMessage.set('Producto actualizado correctamente.');
            this.isSubmitting.set(false);
            this.cancelEdit();
            this.loadItems();
          },
          error: (error) => {
            this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el producto.'));
            this.isSubmitting.set(false);
          },
        });

      return;
    }

    const request = this.buildCreateFormData(raw);
    this.myCatalogApi
      .createItem(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Producto creado correctamente.');
          this.isSubmitting.set(false);
          this.cancelEdit();
          this.loadItems();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo crear el producto.'));
          this.isSubmitting.set(false);
        },
      });
  }

  toggleAvailability(item: CatalogItemResponse): void {
    this.availabilityItemId.set(item.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.myCatalogApi
      .updateItemAvailability(item.id, { isAvailable: !item.isAvailable })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedItem) => {
          this.successMessage.set(
            `Disponibilidad actualizada: ${updatedItem.name} ahora está ${updatedItem.isAvailable ? 'disponible' : 'no disponible'}.`,
          );
          this.availabilityItemId.set(null);
          this.loadItems();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la disponibilidad del producto.'));
          this.availabilityItemId.set(null);
        },
      });
  }

  private buildItemFilters() {
    const filters = this.filtersForm.getRawValue();

    return {
      q: filters.q,
      categoryId: filters.categoryId || undefined,
      isActive: this.toOptionalBoolean(filters.isActive),
      isAvailable: this.toOptionalBoolean(filters.isAvailable),
    };
  }

  private buildCreateFormData(raw: ReturnType<typeof this.form.getRawValue>): FormData {
    const formData = new FormData();
    formData.append('CategoryId', raw.categoryId);
    formData.append('Name', raw.name.trim());
    formData.append('Description', raw.description.trim());
    formData.append('Price', String(raw.price));

    if (this.imageFile) {
      formData.append('ImageFile', this.imageFile, this.imageFile.name);
    }

    return formData;
  }

  private buildUpdateFormData(raw: ReturnType<typeof this.form.getRawValue>): FormData {
    const formData = new FormData();
    formData.append('CategoryId', raw.categoryId);
    formData.append('Name', raw.name.trim());
    formData.append('Description', raw.description.trim());
    formData.append('Price', String(raw.price));
    formData.append('ImageUrl', raw.imageUrl.trim());
    formData.append('IsAvailable', String(raw.isAvailable));
    formData.append('IsActive', String(raw.isActive));

    if (this.imageFile) {
      formData.append('ImageFile', this.imageFile, this.imageFile.name);
    }

    return formData;
  }

  private replaceImagePreview(file: File): void {
    this.clearImagePreview();
    this.imageObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.imageObjectUrl);
  }

  private clearSelectedImage(): void {
    this.imageFile = null;
    this.imageFileName.set('');
    this.clearImagePreview();
    this.imagePreviewUrl.set(this.editingItem()?.imageUrl ?? null);
  }

  private clearImagePreview(): void {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
      this.imageObjectUrl = null;
    }

    this.imagePreviewUrl.set(null);
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

