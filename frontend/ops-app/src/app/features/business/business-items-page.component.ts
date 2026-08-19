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
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-business-items-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    LucideAngularModule,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid w-full min-w-0 max-w-full gap-3.5 sm:gap-4">
      <header class="flex min-w-0 items-center justify-between gap-3 px-0.5">
        <div class="min-w-0">
          <h1 class="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Productos</h1>
          <p class="truncate text-xs font-semibold text-slate-500">{{ items().length }} productos en catálogo</p>
        </div>

        <app-button [routerLink]="['new']" size="sm">
          <lucide-angular class="h-4 w-4" [img]="imagePlusIcon" aria-hidden="true"></lucide-angular>
          Nuevo producto
        </app-button>
      </header>

      @if (errorMessage()) {
        <div class="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-700">
          {{ errorMessage() }}
        </div>
      }

      @if (successMessage()) {
        <div class="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-700">
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

      <div class="grid grid-cols-2 gap-2.5">
        <div class="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
          <span class="text-[11px] font-semibold text-slate-500">Productos</span>
          <strong class="mt-1 block text-xl font-extrabold leading-none text-slate-950">{{ items().length }}</strong>
        </div>
        <div class="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
          <span class="text-[11px] font-semibold text-slate-500">Categorías</span>
          <strong class="mt-1 block text-xl font-extrabold leading-none text-slate-950">{{ categories().length }}</strong>
        </div>
      </div>

      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-100/70 px-3.5 py-3">
        <div class="min-w-0">
          <h2 class="text-[15px] font-bold text-slate-950">Gestión del catálogo</h2>
          <p class="mt-0.5 text-xs leading-5 text-slate-500">Administra productos, precios y categorías.</p>
        </div>
        <app-button variant="ghost" size="sm" [routerLink]="['../categories']">Administrar</app-button>
      </div>

      <div class="grid gap-4 sm:gap-5">
        @if (editingItem()) {
        <app-surface-card id="item-editor" variant="default" extraClass="p-4 sm:p-5">
          <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="packageIcon" aria-hidden="true"></lucide-angular>
              {{ editingItem() ? 'Editar producto' : 'Nuevo producto' }}
            </div>

            <div class="grid gap-4 md:grid-cols-2">
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
                <img class="block h-44 w-full object-cover sm:h-64" [src]="imagePreviewUrl()" alt="Vista previa del producto" />
              </div>
            } @else {
              <div class="grid min-h-44 place-items-center rounded-[24px] border border-dashed border-[#d9c0b8] bg-surface-soft p-5 text-center text-sm font-semibold leading-6 text-text-muted sm:min-h-56 sm:p-6">
                La imagen del producto aparecerá aquí.
              </div>
            }

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Descripción</span>
              <textarea id="itemDescription" rows="4" formControlName="description"></textarea>
            </label>

            @if (editingItem()) {
              <div class="grid gap-3 min-[390px]:grid-cols-2">
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

            <div class="grid gap-3 sm:flex sm:flex-wrap">
              <app-button size="md" type="submit" [disabled]="isSubmitting() || !categories().length">
                {{
                  isSubmitting()
                    ? (editingItem() ? 'Guardando...' : 'Creando...')
                    : (editingItem() ? 'Guardar cambios' : 'Crear')
                }}
              </app-button>
              @if (editingItem()) {
                <app-button variant="secondary" size="md" type="button" (click)="cancelEdit()" [disabled]="isSubmitting()">
                  Cancelar
                </app-button>
              }
              <app-button variant="ghost" size="md" type="button" (click)="reloadData()" [disabled]="isLoading() || isSubmitting()">
                <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                Recargar
              </app-button>
            </div>

            <input type="hidden" formControlName="imageUrl" />
          </form>
        </app-surface-card>
        }

        <section class="grid gap-3" aria-labelledby="current-products-title">
          <div class="grid gap-1 px-0.5">
            <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-primary-700">Lista</span>
            <h2 id="current-products-title" class="text-[17px] font-bold text-slate-950">Productos actuales</h2>
            <p class="text-[13px] leading-5 text-slate-500">Edita un producto o cambia su disponibilidad.</p>
          </div>

          <form class="grid w-full min-w-0 max-w-full gap-3 overflow-hidden rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-sm xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,0.8fr))_auto]" [formGroup]="filtersForm" (ngSubmit)="loadItems()">
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

            <div class="flex flex-wrap items-end gap-2 xl:justify-end">
              <app-button size="sm" type="submit" [disabled]="isLoading()">
                <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
                Aplicar
              </app-button>
              <app-button variant="ghost" size="sm" type="button" (click)="clearFilters()" [disabled]="isLoading()">
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
            <div class="grid gap-3">
              @for (item of items(); track item.id) {
                <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-3.5 sm:p-4">
                  <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div class="flex min-w-0 items-start gap-3">
                      <div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-slate-100 text-slate-500">
                        @if (item.imageUrl) {
                          <img class="h-full w-full object-cover" [src]="item.imageUrl" [alt]="item.name" />
                        } @else {
                          <lucide-angular class="h-5 w-5" [img]="packageIcon" aria-hidden="true"></lucide-angular>
                        }
                      </div>
                      <div class="grid min-w-0 flex-1 gap-1.5">
                      <strong class="truncate text-base font-bold tracking-[-0.02em] text-loreto-carbon" [title]="item.name">{{ item.name }}</strong>
                      <span class="text-[13px] text-text-muted">{{ item.categoryName }} · {{ item.description }}</span>
                      <span class="text-[13px] font-semibold text-loreto-carbon">{{ item.price | currency: 'PEN' : 'S/ ' : '1.2-2' }}</span>
                      </div>
                    </div>

                    <div class="grid gap-2 xl:justify-items-end">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          (click)="toggleAvailability(item)"
                          [disabled]="availabilityItemId() === item.id"
                          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition active:scale-95 disabled:opacity-50"
                          [class]="item.isAvailable ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/20' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-600/20'"
                          [title]="item.isAvailable ? 'Toca para marcar como agotado' : 'Toca para marcar como disponible'"
                        >
                          <span class="h-2 w-2 rounded-full" [class]="item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                          {{ availabilityItemId() === item.id ? 'Guardando...' : (item.isAvailable ? 'Disponible' : 'Agotado') }}
                        </button>
                        <app-status-badge [status]="item.isActive" [label]="item.isActive ? 'Activo' : 'Inactivo'" />
                      </div>

                      <div class="flex items-center gap-2 xl:justify-end">
                        <app-button variant="secondary" size="sm" type="button" (click)="startEdit(item)" [disabled]="isSubmitting()">
                          Editar
                        </app-button>
                      </div>
                    </div>
                  </div>

                  @if (!item.isAvailable || !item.isActive) {
                    <p class="mt-3 rounded-[14px] bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      Este producto no se muestra al público mientras esté inactivo o no disponible.
                    </p>
                  }
                </app-surface-card>
              }
            </div>
          }
        </section>
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
    queueMicrotask(() => document.getElementById('item-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

