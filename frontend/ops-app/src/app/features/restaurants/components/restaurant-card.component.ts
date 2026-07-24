import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { hasText } from '../../../core/utils/api-utils';

export interface RestaurantCardView {
  id: string;
  name: string;
  description: string;
  zoneName: string;
  openTime: string;
  closeTime: string;
  reference?: string;
  isOpenNow?: boolean;
  imageUrl?: string | null;
}

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="grid min-h-full gap-2 rounded-3xl bg-surface-card p-3 shadow-loreto sm:gap-3 sm:p-4">
      <div class="overflow-hidden rounded-xl bg-surface-soft">
        <img class="h-52 w-full object-cover sm:h-52" [src]="resolveImageUrl(restaurant().imageUrl)" [alt]="'Imagen de ' + restaurant().name" loading="lazy" (error)="handleImageError($event)" />
      </div>

      <div class="grid gap-2 p-1 font-ui sm:gap-3">
        <div class="flex items-start justify-between gap-3">
          @if (hasTextValue(restaurant().zoneName)) {
            <span class="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-primary-700 sm:text-sm">{{ restaurant().zoneName }}</span>
          }
          @if (restaurant().isOpenNow !== undefined) {
            <span class="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold sm:text-sm" [class]="restaurant().isOpenNow ? 'bg-primary-100 text-primary-700' : 'bg-accent-500/20 text-accent-600'">
              {{ restaurant().isOpenNow ? 'Abierto' : 'Cerrado' }}
            </span>
          }
        </div>

        <h3 class="truncate font-display text-xl leading-tight text-loreto-carbon sm:text-2xl">{{ restaurant().name }}</h3>
        <p class="line-clamp-2 text-sm leading-tight text-loreto-cecina/85">{{ restaurant().description || 'Disponible para pedir en AppuraPe.' }}</p>

        <div class="mt-1 sm:mt-2">
          <a class="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-primary-700 px-4 text-sm font-bold text-white transition hover:bg-primary-600" [routerLink]="detailRoute()">Ver menu</a>
        </div>
      </div>
    </article>
  `,
})
export class RestaurantCardComponent {
  private static readonly PLACEHOLDER_IMAGE = '/img/catalog-placeholder.svg';

  readonly restaurant = input.required<RestaurantCardView>();
  readonly showReference = input(false);
  readonly detailRoute = input.required<any[]>();

  readonly hasTextValue = hasText;

  getInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || 'A';
  }

  resolveImageUrl(url?: string | null): string {
    return hasText(url ?? '') ? url! : RestaurantCardComponent.PLACEHOLDER_IMAGE;
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith(RestaurantCardComponent.PLACEHOLDER_IMAGE)) {
      return;
    }

    image.src = RestaurantCardComponent.PLACEHOLDER_IMAGE;
  }
}
