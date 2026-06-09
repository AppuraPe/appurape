import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowRight, Clock3, LucideAngularModule, ShoppingCart, Store } from 'lucide-angular';
import { hasText } from '../../../core/utils/api-utils';

export type MenuCardActionMode = 'link' | 'button';
export type MenuCardStatusTone = 'success' | 'warning' | 'muted';

@Component({
  selector: 'app-menu-card',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <article class="group grid min-h-full min-w-0 gap-3 rounded-[24px] border border-[#ead8d2] bg-white p-3.5 shadow-[0_8px_20px_rgba(6,25,43,0.06)] transition duration-200 sm:p-4">
      <div class="relative overflow-hidden rounded-[18px] bg-surface-soft">
        <img class="h-40 w-full object-cover sm:h-44" [src]="resolvedImageUrl()" [alt]="'Imagen de ' + title()" loading="lazy" />
        <div class="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
          @if (hasTextValue(leftChip())) {
            <span class="inline-flex max-w-full rounded-full bg-white/92 px-2.5 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary-700">
              {{ leftChip() }}
            </span>
          }
          @if (hasTextValue(rightChip())) {
            <span class="inline-flex max-w-full rounded-full px-2.5 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em]" [class]="rightChipClass()">
              {{ rightChip() }}
            </span>
          }
        </div>
      </div>

      <div class="grid min-w-0 gap-3">
        <div class="grid min-w-0 gap-1.5">
          <h3 class="line-clamp-2 min-w-0 text-balance font-display text-[1.15rem] font-black leading-tight tracking-[-0.03em] text-loreto-carbon sm:text-[1.25rem]">
            {{ title() }}
          </h3>

          @if (hasTextValue(subtitle())) {
            <div class="flex min-w-0 items-center gap-2 text-sm text-text-muted">
              <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="subtitleIcon()" aria-hidden="true"></lucide-angular>
              <p class="line-clamp-1 min-w-0">{{ subtitle() }}</p>
            </div>
          }

          @if (hasTextValue(description())) {
            <p class="line-clamp-2 text-sm leading-5.5 text-text-muted">{{ description() }}</p>
          }
        </div>

        <div class="mt-auto grid gap-2.5">
          <div class="flex items-center justify-between gap-3">
            @if (hasTextValue(priceLabel())) {
              <strong class="min-w-0 text-lg font-black tracking-[-0.03em] text-primary-700">{{ priceLabel() }}</strong>
            } @else {
              <span class="text-sm font-semibold text-text-muted">Disponible ahora</span>
            }
            @if (hasTextValue(metaBadge())) {
              <span class="shrink-0 rounded-full px-2.5 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em]" [class]="metaBadgeClass()">{{ metaBadge() }}</span>
            }
          </div>

          @if (actionMode() === 'link') {
            <a
              class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-700 px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(229,27,35,0.16)] transition duration-200 hover:bg-primary-600"
              [routerLink]="actionRoute()"
              [queryParams]="actionQueryParams()"
            >
              {{ actionLabel() }}
              <lucide-angular class="h-4 w-4" [img]="arrowRightIcon" aria-hidden="true"></lucide-angular>
            </a>
          } @else {
            <button
              class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-700 px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(229,27,35,0.16)] transition duration-200 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              [disabled]="actionDisabled()"
              [attr.aria-label]="actionAriaLabel()"
              (click)="onPrimaryAction($event)"
            >
              @if (showCartIcon()) {
                <lucide-angular class="h-4 w-4 shrink-0" [img]="shoppingCartIcon" aria-hidden="true"></lucide-angular>
              }
              <span>{{ actionLabel() }}</span>
            </button>
          }
        </div>
      </div>
    </article>
  `,
})
export class MenuCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly description = input('');
  readonly imageUrl = input<string | null | undefined>(null);
  readonly leftChip = input('');
  readonly rightChip = input('');
  readonly rightChipTone = input<MenuCardStatusTone>('muted');
  readonly priceLabel = input('');
  readonly metaBadge = input('');
  readonly metaBadgeTone = input<MenuCardStatusTone>('muted');
  readonly actionLabel = input.required<string>();
  readonly actionMode = input<MenuCardActionMode>('button');
  readonly actionRoute = input<any[] | string | null>(null);
  readonly actionQueryParams = input<Record<string, unknown> | null>(null);
  readonly actionDisabled = input(false);
  readonly compactDesktopAction = input(false);
  readonly showCartIcon = input(false);
  readonly actionAriaLabel = input('');

  readonly primaryAction = output<MouseEvent>();

  readonly shoppingCartIcon = ShoppingCart;
  readonly arrowRightIcon = ArrowRight;
  readonly storeIcon = Store;
  readonly clockIcon = Clock3;
  readonly hasTextValue = hasText;

  readonly rightChipClass = computed(() => this.resolveToneClass(this.rightChipTone()));
  readonly metaBadgeClass = computed(() => this.resolveToneClass(this.metaBadgeTone()));

  resolvedImageUrl(): string {
    return hasText(this.imageUrl() ?? '') ? this.imageUrl()! : '/img/banner1.png';
  }

  subtitleIcon() {
    return this.priceLabel() ? this.storeIcon : this.clockIcon;
  }

  onPrimaryAction(event: MouseEvent): void {
    this.primaryAction.emit(event);
  }

  private resolveToneClass(tone: MenuCardStatusTone): string {
    if (tone === 'success') {
      return 'bg-emerald-50 text-emerald-700';
    }

    if (tone === 'warning') {
      return 'bg-amber-50 text-amber-700';
    }

    return 'bg-white/92 text-loreto-carbon';
  }
}
