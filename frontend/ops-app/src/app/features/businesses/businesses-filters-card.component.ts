import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, FilterX, MapPin, Search } from 'lucide-angular';
import { BusinessZoneListItemResponse } from '../../core/models/businesses.models';

@Component({
  selector: 'app-businesses-filters-card',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <section class="relative z-20 mx-auto flex w-full flex-col gap-3 rounded-[22px] border border-[#ebded9] bg-white px-4 py-4 shadow-[0_18px_44px_rgba(6,25,43,0.08)] md:gap-4 md:px-6 md:py-6 lg:min-h-[88px] lg:rounded-[22px] lg:px-6 lg:py-3">
      <form class="grid w-full gap-3 lg:grid-cols-[46%_34%_20%] lg:items-end lg:gap-4" [formGroup]="form()">
        <label class="grid gap-1">
          <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-primary-600 lg:text-[0.74rem]">BUSCAR</span>
          <div class="flex h-[46px] items-center gap-3 rounded-[16px] border border-[#e6dbd6] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
            <lucide-angular class="h-5 w-5 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
            <input
              id="restaurantSearch"
              type="search"
              formControlName="q"
              placeholder="Busca productos o negocios"
              autocomplete="off"
              class="min-h-0 min-w-0 border-0 bg-transparent px-0 py-0 text-[14px] text-loreto-carbon shadow-none placeholder:text-[#7b879a] focus:ring-0"
            />
          </div>
        </label>

        <label class="grid gap-1">
          <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-primary-600 lg:text-[0.74rem]">ZONA</span>
          <div class="flex h-[46px] items-center gap-3 rounded-[16px] border border-[#e6dbd6] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
            <lucide-angular class="h-5 w-5 text-primary-700" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
            <select
              id="restaurantZone"
              formControlName="zoneId"
              [disabled]="isSearchMode() || (isLoadingZones() && !zones().length)"
              class="min-h-0 min-w-0 w-full border-0 bg-transparent px-0 py-0 text-[14px] text-loreto-carbon shadow-none focus:ring-0 disabled:text-text-muted"
            >
              <option value="">Todas las zonas</option>
              @for (zone of zones(); track zone.id) {
                <option [value]="zone.id">{{ zone.name }}</option>
              }
            </select>
          </div>
        </label>

        <div class="pt-0 lg:pt-0">
          <button
            type="button"
            class="ml-auto inline-flex h-[46px] w-fit items-center justify-center gap-2 rounded-full border border-[#e6dbd6] bg-white px-5 text-[14px] font-semibold text-loreto-carbon shadow-[0_8px_18px_rgba(6,25,43,0.04)] transition hover:bg-surface-soft disabled:opacity-50 lg:w-full lg:px-5"
            [disabled]="!hasActiveFilters()"
            (click)="clearFilters.emit()"
          >
            <lucide-angular class="h-4 w-4 text-primary-700" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
            Limpiar
          </button>
        </div>
      </form>

      @if (zonesErrorMessage()) {
        <div class="hidden rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 lg:block">
          <strong class="block font-black text-loreto-carbon">Zonas</strong>
          <span>{{ zonesErrorMessage() }}</span>
        </div>
      }
    </section>
  `,
})
export class BusinessesFiltersCardComponent {
  readonly form = input.required<FormGroup>();
  readonly zones = input<BusinessZoneListItemResponse[]>([]);
  readonly isSearchMode = input(false);
  readonly isLoadingZones = input(false);
  readonly hasActiveFilters = input(false);
  readonly zonesErrorMessage = input('');

  @Output() readonly clearFilters = new EventEmitter<void>();

  readonly searchIcon = Search;
  readonly mapPinIcon = MapPin;
  readonly filterXIcon = FilterX;
}
