import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  CreateMenuItemRequest,
  MenuCategoryResponse,
  MenuItemResponse,
  UpdateMenuItemRequest,
} from '../../core/models/restaurant.models';
import { MyMenuApiService } from '../../core/services/my-menu-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-restaurant-items-page',
  standalone: true,
  imports: [PageHeaderComponent, CurrencyPipe, ReactiveFormsModule, AppNoticeComponent, StatusBadgeComponent],
  template: `
    <section class="grid">
      <div class="page-card">
        <app-page-header
          eyebrow="Menu"
          title="Productos"
          subtitle="Crea, edita y cambia disponibilidad de productos desde esta vista."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        }

        @if (successMessage()) {
          <div class="message success">{{ successMessage() }}</div>
        }

        @if (!categories().length && !isLoading()) {
          <app-notice
            tone="warning"
            title="Primero crea una categoria"
            message="No puedes publicar productos si no existe al menos una categoria activa para organizarlos."
          />
        }

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid two-col">
            <div class="field">
              <label for="itemCategoryId">Categoria</label>
              <select id="itemCategoryId" formControlName="categoryId">
                <option value="">Selecciona una categoria</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label for="itemName">Nombre</label>
              <input id="itemName" type="text" formControlName="name" />
            </div>

            <div class="field">
              <label for="itemPrice">Precio</label>
              <input id="itemPrice" type="number" min="0.01" step="0.01" formControlName="price" />
            </div>

            <div class="field">
              <label for="itemImageUrl">ImageUrl</label>
              <input id="itemImageUrl" type="text" formControlName="imageUrl" />
            </div>
          </div>

          <div class="field">
            <label for="itemDescription">Descripcion</label>
            <textarea id="itemDescription" rows="4" formControlName="description"></textarea>
          </div>

          @if (editingItem()) {
            <div class="form-grid two-col">
              <label class="checkbox-field">
                <input type="checkbox" formControlName="isAvailable" />
                <span>Disponible</span>
              </label>

              <label class="checkbox-field">
                <input type="checkbox" formControlName="isActive" />
                <span>Activo</span>
              </label>
            </div>
          }

          <div class="page-actions">
            <button class="button primary-action" type="submit" [disabled]="isSubmitting() || !categories().length">
              {{
                isSubmitting()
                  ? (editingItem() ? 'Guardando...' : 'Creando...')
                  : (editingItem() ? 'Guardar cambios' : 'Crear')
              }}
            </button>
            @if (editingItem()) {
              <button class="button secondary" type="button" (click)="cancelEdit()" [disabled]="isSubmitting()">
                Cancelar
              </button>
            }
            <button class="button ghost" type="button" (click)="loadData()" [disabled]="isLoading() || isSubmitting()">
              Recargar
            </button>
          </div>
        </form>
      </div>

      <div class="page-card">
        <app-page-header
          eyebrow="Lista"
          title="Productos actuales"
          subtitle="Selecciona un producto para editarlo o cambia su disponibilidad."
        />

        @if (isLoading()) {
          <div class="message">Cargando productos...</div>
        } @else if (!items().length) {
          <div class="message">Aun no hay productos registrados en el menu.</div>
        } @else {
          <div class="list">
            @for (item of items(); track item.id) {
              <article class="page-card">
                <div class="split">
                  <div class="stack">
                    <strong>{{ item.name }}</strong>
                    <span class="muted">Categoria: {{ item.categoryName }}</span>
                    <span class="muted">{{ item.description }}</span>
                    <span class="muted">Precio: {{ item.price | currency: 'PEN' : 'symbol' : '1.2-2' }}</span>
                  </div>

                  <div class="stack align-end">
                    <app-status-badge [status]="item.isAvailable" [label]="item.isAvailable ? 'Disponible' : 'No disponible'" />
                    <app-status-badge [status]="item.isActive" [label]="item.isActive ? 'Activo' : 'Inactivo'" />
                  </div>
                </div>

                @if (!item.isAvailable || !item.isActive) {
                  <app-notice
                    tone="warning"
                    title="Producto oculto o limitado"
                    message="Este producto no se muestra al publico si esta inactivo o marcado como no disponible."
                  />
                }

                <div class="inline-actions">
                  <button class="button secondary primary-action" type="button" (click)="startEdit(item)" [disabled]="isSubmitting()">
                    Editar
                  </button>
                  <button
                    class="button ghost primary-action"
                    type="button"
                    (click)="toggleAvailability(item)"
                    [disabled]="availabilityItemId() === item.id"
                  >
                    {{
                      availabilityItemId() === item.id
                        ? 'Actualizando...'
                        : (item.isAvailable ? 'Marcar no disponible' : 'Marcar disponible')
                    }}
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class RestaurantItemsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myMenuApi = inject(MyMenuApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<MenuCategoryResponse[]>([]);
  readonly items = signal<MenuItemResponse[]>([]);
  readonly editingItem = signal<MenuItemResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly availabilityItemId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

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
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      categories: this.myMenuApi.getCategories(),
      items: this.myMenuApi.getItems(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, items }) => {
          this.categories.set([...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
          this.items.set([...items].sort((a, b) => a.name.localeCompare(b.name)));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar productos y categorias.'));
          this.isLoading.set(false);
        },
      });
  }

  startEdit(item: MenuItemResponse): void {
    this.editingItem.set(item);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.form.setValue({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
      isActive: item.isActive,
    });
  }

  cancelEdit(): void {
    this.editingItem.set(null);
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
      const request: UpdateMenuItemRequest = {
        categoryId: raw.categoryId,
        name: raw.name.trim(),
        description: raw.description.trim(),
        price: raw.price,
        imageUrl: raw.imageUrl.trim() || null,
        isAvailable: raw.isAvailable,
        isActive: raw.isActive,
      };

      this.myMenuApi
        .updateItem(editingItem.id, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.successMessage.set('Producto actualizado correctamente.');
            this.isSubmitting.set(false);
            this.cancelEdit();
            this.loadData();
          },
          error: (error) => {
            this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el producto.'));
            this.isSubmitting.set(false);
          },
        });

      return;
    }

    const request: CreateMenuItemRequest = {
      categoryId: raw.categoryId,
      name: raw.name.trim(),
      description: raw.description.trim(),
      price: raw.price,
      imageUrl: raw.imageUrl.trim() || null,
    };

    this.myMenuApi
      .createItem(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Producto creado correctamente.');
          this.isSubmitting.set(false);
          this.cancelEdit();
          this.loadData();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo crear el producto.'));
          this.isSubmitting.set(false);
        },
      });
  }

  toggleAvailability(item: MenuItemResponse): void {
    this.availabilityItemId.set(item.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.myMenuApi
      .updateItemAvailability(item.id, { isAvailable: !item.isAvailable })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedItem) => {
          this.items.update((items) =>
            items
              .map((currentItem) => (currentItem.id === updatedItem.id ? updatedItem : currentItem))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );

          if (this.editingItem()?.id === updatedItem.id) {
            this.startEdit(updatedItem);
          }

          this.successMessage.set(
            `Disponibilidad actualizada: ${updatedItem.name} ahora esta ${updatedItem.isAvailable ? 'disponible' : 'no disponible'}.`,
          );
          this.availabilityItemId.set(null);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la disponibilidad del producto.'));
          this.availabilityItemId.set(null);
        },
      });
  }
}
