import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, FilterX, MapPin, Search } from 'lucide-angular';
import { ZoneListItemResponse } from '../../../core/models/restaurants.models';
import { AppButtonComponent } from '../../../shared/components/app-button.component';

@Component({
  selector: 'app-restaurants-filters-card',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, AppButtonComponent],
  template: `
    <section class="relative z-20 mx-auto -mt-5 flex w-full flex-col gap-4 rounded-[24px] border border-[#ead8d2] bg-white p-4 shadow-[0_10px_24px_rgba(6,25,43,0.08)] md:-mt-6 md:p-5">
      @if (hasActiveFilters()) {
        <div class="flex justify-end">
          <app-button variant="ghost" size="sm" (click)="clearFilters.emit()">
            <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
            Limpiar filtros
          </app-button>
        </div>
      }

      <form class="grid w-full gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_auto]" [formGroup]="form()">
        <label class="grid gap-2">
          <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-text-muted">Buscar</span>
          <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#e5d1cb] bg-surface-soft px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
            <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
            <input
              id="restaurantSearch"
              type="search"
              formControlName="q"
              placeholder="Busca comida o restaurante"
              autocomplete="off"
              class="min-h-0 min-w-0 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0"
            />
          </div>
        </label>

        <label class="grid gap-2">
          <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-text-muted">Zona</span>
          <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#e5d1cb] bg-surface-soft px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
            <lucide-angular class="h-4 w-4 text-primary-700" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
            <select
              id="restaurantZone"
              formControlName="zoneId"
              [disabled]="isSearchMode() || (isLoadingZones() && !zones().length)"
              class="min-h-0 min-w-0 w-full border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none focus:ring-0 disabled:text-text-muted"
            >
              <option value="">Todas las zonas</option>
              @for (zone of zones(); track zone.id) {
                <option [value]="zone.id">{{ zone.name }}</option>
              }
            </select>
          </div>
        </label>

        <div class="flex items-end justify-end">
          <app-button variant="secondary" size="lg" type="button" [disabled]="!hasActiveFilters()" (click)="clearFilters.emit()">
            Limpiar
          </app-button>
        </div>
      </form>

      @if (zonesErrorMessage()) {
        <div class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <strong class="block font-black text-loreto-carbon">Zonas</strong>
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

  readonly searchIcon = Search;
  readonly mapPinIcon = MapPin;
  readonly filterXIcon = FilterX;
}
