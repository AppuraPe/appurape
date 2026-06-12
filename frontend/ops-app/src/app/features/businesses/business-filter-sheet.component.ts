import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BusinessTypeListItemResponse, BusinessZoneListItemResponse } from '../../core/models/businesses.models';

@Component({
  selector: 'app-business-filter-sheet',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[90] bg-[#06192b]/45 lg:hidden" (click)="close.emit()"></div>
      <aside class="fixed inset-x-0 bottom-0 z-[91] max-h-[82dvh] overflow-y-auto rounded-t-[30px] border border-[#ead8d2] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 shadow-[0_-18px_44px_rgba(6,25,43,0.18)] lg:hidden">
        <div class="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#e8d7d1]"></div>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="mb-1 text-[1.25rem] font-black tracking-[-0.03em] text-loreto-carbon">Filtros</h2>
            <p class="text-sm text-text-muted">Refina la exploración desde backend.</p>
          </div>
          <button type="button" class="text-sm font-semibold text-primary-700" (click)="clearFilters.emit()">Limpiar</button>
        </div>

        <form class="mt-5 grid gap-4" [formGroup]="form()">
          <label class="grid gap-2">
            <span>Categoría</span>
            <select formControlName="businessTypeId">
              <option value="">Todas las categorías</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>

          <label class="grid gap-2">
            <span>Zona</span>
            <select formControlName="zoneId" [disabled]="isLoadingZones() && !zones().length">
              <option value="">Todas las zonas</option>
              @for (zone of zones(); track zone.id) {
                <option [value]="zone.id">{{ zone.name }}</option>
              }
            </select>
          </label>

          <label class="grid gap-2">
            <span>Orden</span>
            <select formControlName="sort">
              <option value="">Por defecto</option>
              <option value="popular">Más buscados</option>
              <option value="alphabetical">Alfabético</option>
              <option value="recent">Más recientes</option>
            </select>
          </label>

          <label class="flex items-center justify-between gap-3 rounded-[20px] border border-[#ead8d2] bg-surface-soft px-4 py-3">
            <span class="text-sm font-semibold text-loreto-carbon">Abierto ahora</span>
            <input type="checkbox" formControlName="openNow" />
          </label>
        </form>

        <div class="mt-6 flex gap-3">
          <button type="button" class="button secondary flex-1" (click)="close.emit()">Cerrar</button>
          <button type="button" class="button flex-1" (click)="close.emit()">Aplicar</button>
        </div>
      </aside>
    }
  `,
})
export class BusinessFilterSheetComponent {
  readonly isOpen = input(false);
  readonly form = input.required<FormGroup>();
  readonly zones = input<BusinessZoneListItemResponse[]>([]);
  readonly categories = input<BusinessTypeListItemResponse[]>([]);
  readonly isLoadingZones = input(false);

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly clearFilters = new EventEmitter<void>();
}
