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
    <article class="grid min-h-full gap-2 rounded-3xl border border-loreto-tacacho/35 bg-surface-card p-3 shadow-loreto sm:gap-3 sm:p-4">
      <div class="overflow-hidden rounded-xl border border-loreto-tacacho/35 bg-surface-soft">
        <img class="aspect-square w-full object-cover" [src]="resolveImageUrl(food().imageUrl)" [alt]="'Imagen de ' + food().name" loading="lazy" />
      </div>

      <div class="grid gap-2 p-1 font-ui text-center">
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
            [routerLink]="['/restaurants', food().restaurantId]"
            [queryParams]="{ menuSearch: appliedQuery(), searchSource: 'global', matchedItemId: food().menuItemId, matchedCategoryName: food().categoryName || null }"
          >
            {{ food().price | currency: 'PEN' : 'symbol' : '1.2-2' }}
          </a>
        </div>
      </div>
    </article>
  `,
})
export class FoodResultCardComponent {
  readonly food = input.required<PublicSearchFoodItemResponse>();
  readonly appliedQuery = input.required<string>();
  readonly hasTextValue = hasText;

  resolveImageUrl(url?: string | null): string {
    return hasText(url ?? '') ? url! : '/img/banner1.png';
  }
}
