import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ImagePlus, LucideAngularModule, PackagePlus } from 'lucide-angular';
import { CatalogCategoryResponse } from '../../core/models/business.model';
import { MyCatalogApiService } from '../../core/services/my-catalog-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { validateImageFile } from '../../core/utils/file-upload.utils';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';

@Component({
  selector: 'app-business-item-new-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    BottomSafeActionBarComponent,
  ],
  template: `
    <section class="mx-auto grid w-full min-w-0 max-w-3xl gap-4 pb-2 sm:gap-5">
      <header class="grid gap-3 px-0.5">
        <div class="min-w-0">
          <h1 class="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Nuevo producto</h1>
          <p class="mt-0.5 text-xs text-slate-500">Completa los datos para publicar un producto en el catálogo.</p>
        </div>

        @if (errorMessage()) {
          <app-notice tone="danger" [message]="errorMessage()" />
        }

        @if (!isLoadingCategories() && !categories().length) {
          <app-notice
            tone="warning"
            title="Necesitas una categoría"
            message="Crea una categoría activa antes de publicar tu primer producto."
          />
          <div class="mt-3">
            <app-button variant="secondary" size="md" [routerLink]="['../../categories']">Ir a categorías</app-button>
          </div>
        }
      </header>

      <form class="grid gap-4 sm:gap-5" [formGroup]="form" (ngSubmit)="submit()">
        <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-4 sm:p-5">
          <div class="mb-4">
            <p class="text-xs font-black uppercase tracking-[0.12em] text-primary-700">Información básica</p>
            <p class="mt-1 text-sm text-slate-500">Describe el producto como lo verá el cliente.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1.5">
              <span class="text-sm font-semibold text-slate-800">Categoría</span>
              <select formControlName="categoryId">
                <option value="">Selecciona una categoría</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </label>

            <label class="grid gap-1.5">
              <span class="text-sm font-semibold text-slate-800">Nombre</span>
              <input type="text" formControlName="name" maxlength="150" placeholder="Ej. Juane regional" />
            </label>
          </div>

          <label class="mt-4 grid gap-1.5">
            <span class="text-sm font-semibold text-slate-800">Descripción</span>
            <textarea rows="3" formControlName="description" maxlength="500" placeholder="Describe el producto brevemente"></textarea>
          </label>
        </app-surface-card>

        <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-4 sm:p-5">
          <div class="mb-4">
            <p class="text-xs font-black uppercase tracking-[0.12em] text-primary-700">Precio</p>
            <p class="mt-1 text-sm text-slate-500">Ingresa el precio que se mostrará en AppuraPe.</p>
          </div>

          <div class="max-w-xs">
            <label class="grid gap-1.5">
              <span class="text-sm font-semibold text-slate-800">Precio AppuraPe</span>
              <input type="number" min="0.01" step="0.01" inputmode="decimal" formControlName="price" />
              @if (form.controls.price.value > 0) {
                <small class="text-xs font-semibold text-primary-700">
                  Se mostrará como {{ form.controls.price.value | currency: 'PEN' : 'S/ ' : '1.2-2' }}
                </small>
              }
            </label>
          </div>
          <p class="mt-3 text-xs leading-5 text-slate-500">Las comisiones se aplican según la configuración vigente; esta pantalla no modifica ese cálculo.</p>
        </app-surface-card>

        <app-surface-card variant="default" extraClass="w-full min-w-0 max-w-full p-4 sm:p-5">
          <div class="mb-4">
            <p class="text-xs font-black uppercase tracking-[0.12em] text-primary-700">Imagen</p>
            <p class="mt-1 text-sm text-slate-500">Usa una foto clara, centrada y fácil de reconocer.</p>
          </div>

          <div class="grid gap-2">
            <label class="grid cursor-pointer place-items-center gap-2 rounded-[16px] border border-dashed border-primary-300 bg-primary-50/60 p-4 text-center transition hover:bg-primary-50">
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary-700 shadow-sm">
                <lucide-angular class="h-5 w-5" [img]="imageIcon" aria-hidden="true" />
              </span>
              <span class="text-sm font-bold text-slate-900">{{ imageFileName() || 'Seleccionar imagen' }}</span>
              <small class="text-xs text-slate-500">PNG, JPG o WEBP · máximo 5 MB</small>
              <input class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
            </label>
          </div>

          @if (imagePreviewUrl()) {
            <div class="mt-4 overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50">
              <img class="block h-44 w-full object-cover sm:h-56" [src]="imagePreviewUrl()" alt="Vista previa del producto" />
            </div>
          }
        </app-surface-card>

        <app-surface-card variant="soft" extraClass="w-full min-w-0 max-w-full p-4">
          <p class="text-xs font-black uppercase tracking-[0.12em] text-primary-700">Disponibilidad</p>
          <p class="mt-1 text-sm leading-5 text-slate-500">
            Al publicar, podrÃ¡s controlar si el producto se muestra a clientes desde la lista del catÃ¡logo.
          </p>
        </app-surface-card>

        <app-bottom-safe-action-bar mode="static" [extraClass]="'w-full min-w-0 max-w-full !rounded-[18px] !border !border-slate-200 !bg-white !p-3 !shadow-sm'">
          <div class="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:flex sm:justify-end">
            <app-button variant="ghost" size="sm" type="button" [routerLink]="['../']" [disabled]="isSubmitting()">
              Cancelar
            </app-button>
            <app-button size="md" type="submit" [block]="true" [loading]="isSubmitting()" [disabled]="isLoadingCategories() || !categories().length">
              <lucide-angular class="h-4 w-4" [img]="productIcon" aria-hidden="true" />
              {{ isSubmitting() ? 'Publicando...' : 'Publicar producto' }}
            </app-button>
          </div>
        </app-bottom-safe-action-bar>
      </form>
    </section>
  `,
})
export class BusinessItemNewPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly myCatalogApi = inject(MyCatalogApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<CatalogCategoryResponse[]>([]);
  readonly isLoadingCategories = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly imageFileName = signal('');
  readonly imagePreviewUrl = signal<string | null>(null);

  readonly imageIcon = ImagePlus;
  readonly productIcon = PackagePlus;

  private imageFile: File | null = null;
  private imageObjectUrl: string | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    categoryId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(500)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearImagePreview());
    this.loadCategories();
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
    this.clearImagePreview();
    this.imageObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.imageObjectUrl);
  }

  submit(): void {
    if (this.form.invalid || !this.categories().length) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = new FormData();
    request.append('CategoryId', raw.categoryId);
    request.append('Name', raw.name.trim());
    request.append('Description', raw.description.trim());
    request.append('Price', String(raw.price));

    if (this.imageFile) {
      request.append('ImageFile', this.imageFile, this.imageFile.name);
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.myCatalogApi
      .createItem(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.success('Producto creado correctamente.');
          void this.router.navigateByUrl(this.productsRoute());
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(getErrorMessage(error, 'No se pudo crear el producto.'));
        },
      });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.myCatalogApi
      .getCategories({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set([...categories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)));
          this.isLoadingCategories.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar las categorías.'));
          this.isLoadingCategories.set(false);
        },
      });
  }

  private productsRoute(): string {
    return this.router.url.startsWith('/restaurant/') ? '/restaurant/menu/items' : '/business/menu/items';
  }

  private clearSelectedImage(): void {
    this.imageFile = null;
    this.imageFileName.set('');
    this.clearImagePreview();
  }

  private clearImagePreview(): void {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
      this.imageObjectUrl = null;
    }

    this.imagePreviewUrl.set(null);
  }
}
