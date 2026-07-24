import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSearchFoodItemResponse } from '../../../core/models/restaurants.models';
import { hasText } from '../../../core/utils/api-utils';

@Component({
  selector: 'app-food-result-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <article class="grid w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 sm:overflow-visible sm:rounded-3xl sm:border sm:border-loreto-tacacho/35 sm:bg-surface-card sm:p-3 sm:shadow-loreto">
      <div class="grid w-full min-w-0 grid-cols-[88px_minmax(0,1fr)_64px] overflow-hidden rounded-2xl sm:hidden min-[375px]:grid-cols-[96px_minmax(0,1fr)_68px]">
        <div class="h-full min-h-[104px] overflow-hidden bg-slate-50">
          <img class="block h-full w-full object-cover object-center" [src]="resolveImageUrl(food().imageUrl)" [alt]="'Imagen de ' + food().name" loading="lazy" (error)="handleImageError($event)" />
        </div>

        <div class="min-w-0 px-3 py-3">
          <h3 class="line-clamp-2 min-w-0 break-words text-[13px] font-bold leading-[1.2] text-slate-950 min-[375px]:text-sm">
            {{ food().name }}
          </h3>
          <p class="mt-1.5 truncate text-[11px] leading-tight text-slate-500">
            {{ food().restaurantName }}
            @if (hasTextValue(food().zoneName)) {
              <span class="mx-1 text-text-muted/60">·</span>
              <span>{{ food().zoneName }}</span>
            }
          </p>
          <p class="mt-1.5 line-clamp-2 text-[10px] leading-[1.35] text-slate-500">
            {{ food().description || food().categoryName || 'Disponible para pedir en AppuraPe.' }}
          </p>
          <div class="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-tight text-slate-500">
            <span class="font-semibold text-primary-700">
              {{ food().price | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </span>
            @if (hasTextValue(food().categoryName)) {
              <span>{{ food().categoryName }}</span>
            }
          </div>
        </div>

        <div class="flex items-center justify-center bg-red-50/80 px-2">
          <a
            class="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-red-500 transition active:scale-95"
            [routerLink]="['/businesses', food().restaurantId, 'products', food().menuItemId]"
            aria-label="Ver producto"
          >
            <span class="text-lg leading-none">+</span>
          </a>
        </div>
      </div>

      <div class="hidden gap-2 sm:grid sm:min-h-full sm:gap-3 sm:p-1 sm:font-ui">
        <div class="overflow-hidden rounded-xl border border-loreto-tacacho/35 bg-surface-soft">
          <img class="aspect-square w-full object-cover" [src]="resolveImageUrl(food().imageUrl)" [alt]="'Imagen de ' + food().name" loading="lazy" (error)="handleImageError($event)" />
        </div>

        <div class="grid gap-2 p-1 text-center">
          <div class="flex justify-center">
            @if (hasTextValue(food().categoryName)) {
              <span class="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-primary-700 sm:text-sm">{{ food().categoryName }}</span>
            }
          </div>
          <h3 class="line-clamp-2 font-display text-xl leading-tight text-loreto-carbon sm:text-2xl">{{ food().name }}</h3>
          <p class="line-clamp-2 text-sm leading-tight text-loreto-cecina/85">{{ food().description || 'Disponible para pedir en AppuraPe.' }}</p>
          <div class="flex justify-center">
            @if (hasTextValue(food().zoneName)) {
              <span class="inline-flex rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-primary-700 sm:text-sm">{{ food().zoneName }}</span>
            }
          </div>

          <div class="mt-1 sm:mt-2">
            <a
              class="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-accent-500 px-4 text-sm font-bold text-surface-soft transition hover:bg-accent-600"
              [routerLink]="['/businesses', food().restaurantId, 'products', food().menuItemId]"
            >
              {{ food().price | currency: 'PEN' : 'symbol' : '1.2-2' }}
            </a>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class FoodResultCardComponent {
  private static readonly PLACEHOLDER_IMAGE = '/img/catalog-placeholder.svg';

  readonly food = input.required<PublicSearchFoodItemResponse>();
  readonly appliedQuery = input.required<string>();
  readonly hasTextValue = hasText;

  resolveImageUrl(url?: string | null): string {
    return hasText(url ?? '') ? url! : FoodResultCardComponent.PLACEHOLDER_IMAGE;
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith(FoodResultCardComponent.PLACEHOLDER_IMAGE)) {
      return;
    }

    image.src = FoodResultCardComponent.PLACEHOLDER_IMAGE;
  }
}
