import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowRight, Clock3, LucideAngularModule, MapPin, ShoppingBag, Star } from 'lucide-angular';
import { hasText } from '../../core/utils/api-utils';

@Component({
  selector: 'app-businesses-business-card',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <article class="group w-full max-w-full min-w-0 box-border overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 sm:overflow-visible sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0">
      <div class="grid w-full min-w-0 grid-cols-[88px_minmax(0,1fr)_60px] overflow-hidden rounded-2xl sm:hidden min-[375px]:grid-cols-[96px_minmax(0,1fr)_64px]">
        <div class="h-full min-h-[104px] overflow-hidden bg-slate-50">
          <img
            class="block h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
            [src]="resolvedImageUrl()"
            [alt]="'Imagen de ' + name()"
            loading="lazy"
            (error)="onImageError($event)"
          />
        </div>

        <div class="min-w-0 px-3 py-3">
          <h3 class="line-clamp-2 min-w-0 break-words text-[13px] font-bold leading-[1.2] text-slate-950 min-[375px]:text-sm">
            {{ name() }}
          </h3>
          @if (hasTextValue(categoryLabel()) || hasTextValue(zoneName())) {
            <p class="mt-1.5 truncate text-[11px] leading-tight text-slate-500">
              @if (hasTextValue(categoryLabel())) {
                <span>{{ categoryLabel() }}</span>
              }
              @if (hasTextValue(categoryLabel()) && hasTextValue(zoneName())) {
                <span class="mx-1 text-text-muted/60">·</span>
              }
              @if (hasTextValue(zoneName())) {
                <span>{{ zoneName() }}</span>
              }
            </p>
          }

          <div class="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-tight text-slate-500">
            @if (hasTextValue(ratingLabel())) {
              <span class="inline-flex items-center gap-1 text-[#f5b100]">
                <lucide-angular class="h-3.5 w-3.5 shrink-0" [img]="starIcon" aria-hidden="true"></lucide-angular>
                <span class="font-semibold text-loreto-carbon">{{ ratingLabel() }}</span>
              </span>
            }

            @if (hasTextValue(deliveryTimeLabel())) {
              <span class="inline-flex items-center gap-1 text-[#6f7f95]">
                <lucide-angular class="h-3.5 w-3.5 shrink-0 text-primary-600" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                <span class="font-medium">{{ deliveryTimeLabel() }}</span>
              </span>
            }

            @if (!hasTextValue(deliveryTimeLabel()) && hasTextValue(scheduleLabel())) {
              <span class="inline-flex items-center gap-1 text-[#6f7f95]">
                <lucide-angular class="h-3.5 w-3.5 shrink-0 text-primary-600" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                <span class="font-medium">{{ scheduleLabel() }}</span>
              </span>
            }

            @if (hasTextValue(isOpenNowLabel())) {
              <span class="inline-flex items-center gap-1 text-[#6f7f95]">
                <span class="font-medium">{{ isOpenNowLabel() }}</span>
              </span>
            }
          </div>
        </div>

        <div class="flex items-center justify-center bg-red-50/80 px-2">
          <a
            class="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-red-500 transition active:scale-95"
            [routerLink]="actionRoute()"
            [attr.aria-label]="actionLabel()"
          >
            <lucide-angular class="h-5 w-5" [img]="shoppingCartIcon" aria-hidden="true"></lucide-angular>
          </a>
        </div>
      </div>

      <div class="hidden h-full min-h-[185px] max-h-[210px] flex-col overflow-hidden rounded-[18px] border border-[#e8edf3] bg-white shadow-[0_14px_30px_rgba(6,25,43,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(6,25,43,0.1)] sm:flex">
        <div class="relative overflow-hidden rounded-t-[18px] bg-[#f3f6fa]">
          <img
            class="h-[170px] w-full object-cover object-center transition duration-300 group-hover:scale-[1.03] lg:h-[116px]"
            [src]="resolvedImageUrl()"
            [alt]="'Imagen de ' + name()"
            loading="lazy"
            (error)="onImageError($event)"
          />
        </div>

        <div class="flex flex-1 flex-col gap-2.5 px-4 py-4 lg:px-[12px] lg:py-[10px]">
          <div class="grid min-w-0 gap-1.5">
            <h3 class="line-clamp-1 min-w-0 text-balance text-[1.05rem] font-black leading-tight tracking-[-0.03em] text-loreto-carbon lg:text-[1rem]">
              {{ name() }}
            </h3>
            @if (hasTextValue(categoryLabel())) {
              <p class="line-clamp-1 text-[0.95rem] text-text-muted lg:text-[0.9rem]">
                {{ categoryLabel() }}
              </p>
            }
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.92rem] text-loreto-carbon">
            @if (hasTextValue(ratingLabel())) {
              <span class="inline-flex items-center gap-1.5 text-[#f5b100]">
                <lucide-angular class="h-4 w-4 shrink-0" [img]="starIcon" aria-hidden="true"></lucide-angular>
                <span class="font-semibold text-loreto-carbon">{{ ratingLabel() }}</span>
              </span>
            }

            @if (hasTextValue(deliveryTimeLabel())) {
              <span class="inline-flex items-center gap-1.5 text-[#6f7f95]">
                <lucide-angular class="h-4 w-4 shrink-0 text-primary-600" [img]="clockIcon" aria-hidden="true"></lucide-angular>
                <span class="font-medium">{{ deliveryTimeLabel() }}</span>
              </span>
            }

            @if (hasTextValue(zoneName())) {
              <span class="inline-flex items-center gap-1.5 text-[#6f7f95]">
                <lucide-angular class="h-4 w-4 shrink-0 text-primary-600" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                <span class="font-medium">{{ zoneName() }}</span>
              </span>
            }
          </div>

          <div class="mt-auto">
            <a
              class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary-700 px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(229,27,35,0.16)] transition duration-200 hover:bg-primary-600"
              [routerLink]="actionRoute()"
            >
              {{ actionLabel() }}
              <lucide-angular class="h-4 w-4" [img]="arrowRightIcon" aria-hidden="true"></lucide-angular>
            </a>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class BusinessesBusinessCardComponent {
  readonly name = input.required<string>();
  readonly categoryLabel = input('');
  readonly ratingLabel = input('');
  readonly deliveryTimeLabel = input('');
  readonly scheduleLabel = input('');
  readonly isOpenNowLabel = input('');
  readonly zoneName = input('');
  readonly imageUrl = input<string | null | undefined>(null);
  readonly actionLabel = input('Ver negocio');
  readonly actionRoute = input<any[] | string | null>(null);

  readonly hasTextValue = hasText;
  readonly starIcon = Star;
  readonly clockIcon = Clock3;
  readonly mapPinIcon = MapPin;
  readonly arrowRightIcon = ArrowRight;
  readonly shoppingCartIcon = ShoppingBag;

  readonly resolvedImageUrl = computed(() => {
    if (hasText(this.imageUrl() ?? '')) {
      return this.imageUrl()!;
    }

    return '/img/business-placeholder.svg';
  });

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith('/img/business-placeholder.svg')) {
      return;
    }

    image.src = '/img/business-placeholder.svg';
    image.style.objectFit = 'contain';
    image.style.objectPosition = 'center';
    image.style.backgroundColor = '#f3f6fa';
    image.style.padding = '12px';
  }
}
