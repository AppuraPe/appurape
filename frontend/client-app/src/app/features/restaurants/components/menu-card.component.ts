import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShoppingCart } from 'lucide-angular';
import { hasText } from '../../../core/utils/api-utils';

export type MenuCardActionMode = 'link' | 'button';
export type MenuCardStatusTone = 'success' | 'warning' | 'muted';

@Component({
  selector: 'app-menu-card',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <article class="grid min-h-full gap-2 rounded-3xl border border-loreto-tacacho/30 bg-surface-card p-3 shadow-loreto sm:gap-3 sm:p-4">
      <div class="overflow-hidden rounded-xl bg-surface-soft">
        <img class="h-52 w-full object-cover sm:h-52" [src]="resolvedImageUrl()" [alt]="'Imagen de ' + title()" loading="lazy" />
      </div>

      <div class="grid gap-2 p-1 font-ui sm:gap-3">
        @if (hasTextValue(leftChip()) || hasTextValue(rightChip())) {
          <div class="flex items-start justify-between gap-3">
            @if (hasTextValue(leftChip())) {
              <span class="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-primary-700 sm:text-sm">{{ leftChip() }}</span>
            }
            @if (hasTextValue(rightChip())) {
              <span class="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold sm:text-sm" [class]="rightChipClass()">
                {{ rightChip() }}
              </span>
            }
          </div>
        }

        <h3 class="line-clamp-2 font-display text-xl leading-tight text-loreto-carbon sm:text-2xl">{{ title() }}</h3>

        @if (hasTextValue(subtitle())) {
          <p class="line-clamp-1 text-sm leading-tight text-loreto-cecina/90">{{ subtitle() }}</p>
        }

        @if (hasTextValue(description())) {
          <p class="line-clamp-2 text-sm leading-tight text-loreto-cecina/85">{{ description() }}</p>
        }

        <div class="mt-1 flex items-center justify-between gap-2 sm:mt-2">
          @if (hasTextValue(priceLabel())) {
            <strong class="text-lg font-bold text-primary-700">{{ priceLabel() }}</strong>
          }
          @if (hasTextValue(metaBadge())) {
            <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="metaBadgeClass()">{{ metaBadge() }}</span>
          }
        </div>

        <div class="mt-1 sm:mt-2">
          @if (actionMode() === 'link') {
            <a class="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-primary-700 px-4 text-sm font-bold text-white transition hover:bg-primary-600" [routerLink]="actionRoute()" [queryParams]="actionQueryParams()">
              {{ actionLabel() }}
            </a>
          } @else {
            <button
              class="group inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              [disabled]="actionDisabled()"
              [attr.aria-label]="actionAriaLabel()"
              (click)="onPrimaryAction($event)"
            >
              @if (showCartIcon()) {
                <lucide-angular class="h-4 w-4 shrink-0" [img]="shoppingCartIcon" aria-hidden="true"></lucide-angular>
              }
              @if (compactDesktopAction()) {
                <span class="ml-2 inline md:hidden">{{ actionLabel() }}</span>
                <span class="hidden max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 md:inline-block md:group-hover:ml-2 md:group-hover:max-w-[11rem] md:group-hover:opacity-100 md:group-focus-visible:ml-2 md:group-focus-visible:max-w-[11rem] md:group-focus-visible:opacity-100">{{ actionLabel() }}</span>
              } @else {
                <span [class.ml-2]="showCartIcon()">{{ actionLabel() }}</span>
              }
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
  readonly hasTextValue = hasText;

  readonly rightChipClass = computed(() => this.resolveToneClass(this.rightChipTone()));
  readonly metaBadgeClass = computed(() => this.resolveToneClass(this.metaBadgeTone()));

  resolvedImageUrl(): string {
    return hasText(this.imageUrl() ?? '') ? this.imageUrl()! : '/img/banner1.png';
  }

  onPrimaryAction(event: MouseEvent): void {
    this.primaryAction.emit(event);
  }

  private resolveToneClass(tone: MenuCardStatusTone): string {
    if (tone === 'success') {
      return 'bg-primary-100 text-primary-700';
    }

    if (tone === 'warning') {
      return 'bg-accent-500/20 text-accent-600';
    }

    return 'bg-surface-soft text-loreto-carbon';
  }
}
