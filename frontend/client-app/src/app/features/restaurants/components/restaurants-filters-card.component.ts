import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ZoneListItemResponse } from '../../../core/models/restaurants.models';

@Component({
  selector: 'app-restaurants-filters-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="relative z-20 mx-auto -mt-14 flex w-[min(1160px,calc(100%-1rem))] flex-col rounded-2xl border border-[#d9d8d2] bg-[#f9f9f5] p-3 shadow-[0_12px_24px_rgba(28,48,53,0.25)] md:-mt-14 md:p-4">
      <form class="grid w-full gap-3 md:grid-cols-[1.55fr_0.95fr_auto]" [formGroup]="form()">
        <div class="grid gap-1">
          <label for="restaurantSearch" class="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#7a6658]">Buscar</label>
          <input
            id="restaurantSearch"
            type="search"
            formControlName="q"
            placeholder="Busca comida o restaurante"
            autocomplete="off"
            class="min-h-11 rounded-xl border border-[#d8ccb7] bg-white px-3 text-sm text-[#3d2c22] outline-none focus:border-[#0d6883]"
          />
        </div>

        <div class="grid gap-1">
          <label for="restaurantZone" class="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#7a6658]">Zona</label>
          <select
            id="restaurantZone"
            formControlName="zoneId"
            [disabled]="isSearchMode() || (isLoadingZones() && !zones().length)"
            class="min-h-11 rounded-xl border border-[#d8ccb7] bg-white px-3 text-sm text-[#3d2c22] outline-none focus:border-[#0d6883]"
          >
            <option value="">Todas las zonas</option>
            @for (zone of zones(); track zone.id) {
              <option [value]="zone.id">{{ zone.name }}</option>
            }
          </select>
        </div>

        <div class="flex items-end justify-between gap-2 md:justify-end">
          <button
            class="min-h-10 rounded-full bg-[#ecece4] px-4 text-xs font-semibold text-[#7a6658] disabled:opacity-60"
            type="button"
            (click)="clearFilters.emit()"
            [disabled]="!hasActiveFilters()"
          >
            Limpiar
          </button>
        </div>
      </form>

      @if (zonesErrorMessage()) {
        <div class="mt-3 rounded-xl border border-[#cddcff] bg-[#eef4ff] p-3 text-sm text-[#3c8fa8]">
          <strong class="block text-[#3d2c22]">Seguimos mostrando resultados</strong>
          <span>{{ zonesErrorMessage() }}</span>
        </div>
      }
    </section>
  `,
})
export class RestaurantsFiltersCardComponent {
  readonly form = input.required<FormGroup>();
  readonly zones = input<ZoneListItemResponse[]>([]);
  readonly isSearchMode = input(false);
  readonly isLoadingZones = input(false);
  readonly hasActiveFilters = input(false);
  readonly zonesErrorMessage = input('');

  @Output() readonly clearFilters = new EventEmitter<void>();
}

