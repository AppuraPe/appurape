import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BusinessTypeListItemResponse, BusinessZoneListItemResponse } from '../../core/models/businesses.models';

@Component({
  selector: 'app-business-filter-sheet',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[110] bg-[#06192b]/45 lg:hidden" (click)="close.emit()"></div>
      <aside
        class="fixed inset-x-0 bottom-0 z-[111] flex max-h-[82dvh] min-w-0 flex-col overflow-hidden rounded-t-[24px] border border-[#ead8d2] bg-white shadow-[0_-14px_36px_rgba(6,25,43,0.16)] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-filter-title"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3">
          <div class="mx-auto mb-3 h-1 w-12 rounded-full bg-[#e8d7d1]"></div>
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h2 id="business-filter-title" class="mb-1 text-[1.25rem] font-black tracking-[-0.03em] text-loreto-carbon">Filtros</h2>
              <p class="text-sm leading-5 text-text-muted">Encuentra negocios según categoría, zona y disponibilidad.</p>
            </div>
            <button type="button" class="min-h-11 shrink-0 px-1 text-sm font-semibold text-primary-700" (click)="clearFilters.emit()">Limpiar</button>
          </div>

          <form class="mt-4 grid gap-3 pb-3" [formGroup]="form()">
            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Categoría</span>
              <select class="min-h-12 w-full min-w-0 rounded-[14px]" formControlName="businessTypeId">
                <option value="">Todas las categorías</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </label>

            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Zona</span>
              <select
                class="min-h-12 w-full min-w-0 rounded-[14px]"
                [class.opacity-60]="isLoadingZones() && !zones().length"
                [attr.aria-busy]="isLoadingZones() && !zones().length"
                formControlName="zoneId"
              >
                <option value="">Todas las zonas</option>
                @for (zone of zones(); track zone.id) {
                  <option [value]="zone.id">{{ zone.name }}</option>
                }
              </select>
            </label>

            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-semibold text-loreto-carbon">Orden</span>
              <select class="min-h-12 w-full min-w-0 rounded-[14px]" formControlName="sort">
                <option value="">Por defecto</option>
                <option value="popular">Más buscados</option>
                <option value="alphabetical">Alfabético</option>
                <option value="recent">Más recientes</option>
              </select>
            </label>

            <label class="flex min-h-[48px] items-center justify-between gap-3 rounded-[16px] border border-[#ead8d2] bg-surface-soft px-4 py-2">
              <span class="text-sm font-semibold text-loreto-carbon">Abierto ahora</span>
              <input type="checkbox" formControlName="openNow" />
            </label>
          </form>
        </div>

        <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3">
          <button type="button" class="button secondary h-11 w-full py-0" (click)="close.emit()">Cerrar</button>
          <button type="button" class="button h-11 w-full py-0" (click)="close.emit()">Aplicar filtros</button>
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
