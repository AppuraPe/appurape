import { Component, EventEmitter, Output, input } from '@angular/core';
import { LucideAngularModule, Cross, Hammer, Shirt, ShoppingBasket, Utensils } from 'lucide-angular';
import { BusinessTypeListItemResponse } from '../../core/models/businesses.models';

@Component({
  selector: 'app-popular-category-carousel',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <section class="w-full lg:hidden">
      <h2 class="mt-4 px-4 text-xl font-extrabold leading-tight text-slate-950">Categorías más buscadas</h2>

      <div class="mt-2.5 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        @for (category of categories(); track category.id) {
          <button
            type="button"
            class="flex h-24 w-24 min-w-24 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-2 shadow-sm active:scale-95"
            (click)="selectCategory.emit(category.id)"
          >
            <span class="grid h-10 w-10 place-items-center rounded-full text-white" [style.background]="iconColor(category.iconKey)">
              <lucide-angular class="h-5 w-5" [img]="resolveIcon(category.iconKey)" aria-hidden="true"></lucide-angular>
            </span>
            <span class="line-clamp-2 text-center text-[11px] font-medium leading-tight text-slate-700">{{ category.name }}</span>
          </button>
        }
      </div>
    </section>
  `,
})
export class PopularCategoryCarouselComponent {
  readonly categories = input<BusinessTypeListItemResponse[]>([]);

  @Output() readonly selectCategory = new EventEmitter<string>();

  readonly utensilsIcon = Utensils;
  readonly hammerIcon = Hammer;
  readonly basketIcon = ShoppingBasket;
  readonly crossIcon = Cross;
  readonly shirtIcon = Shirt;

  resolveIcon(iconKey?: string | null) {
    switch (iconKey) {
      case 'hammer':
        return this.hammerIcon;
      case 'shopping-cart':
        return this.basketIcon;
      case 'cross':
        return this.crossIcon;
      case 'shirt':
        return this.shirtIcon;
      default:
        return this.utensilsIcon;
    }
  }

  iconColor(iconKey?: string | null): string {
    switch (iconKey) {
      case 'hammer':
        return '#2f6df6';
      case 'shopping-cart':
        return '#25b05a';
      case 'cross':
        return '#9b4dff';
      case 'shirt':
        return '#f5ad19';
      default:
        return '#ff7a18';
    }
  }
}
