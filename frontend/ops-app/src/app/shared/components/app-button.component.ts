import { NgClass, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, RouterLink],
  host: {
    class: 'inline-flex min-w-0 max-w-full box-border',
    '[class.w-full]': 'block()',
  },
  template: `
    <ng-template #projectedContent>
      <ng-content />
    </ng-template>

    @if (routerLink()) {
      <a [routerLink]="routerLink()!" [attr.aria-disabled]="isDisabled() ? 'true' : null" [ngClass]="buttonClass()">
        @if (loading()) {
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
        }
        <span class="contents">
          <ng-container [ngTemplateOutlet]="projectedContent"></ng-container>
        </span>
      </a>
    } @else if (href()) {
      <a [href]="href()!" [attr.target]="target() || null" [attr.rel]="rel() || null" [attr.aria-disabled]="isDisabled() ? 'true' : null" [ngClass]="buttonClass()">
        @if (loading()) {
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
        }
        <span class="contents">
          <ng-container [ngTemplateOutlet]="projectedContent"></ng-container>
        </span>
      </a>
    } @else {
      <button [type]="type()" [disabled]="isDisabled()" [ngClass]="buttonClass()">
        @if (loading()) {
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
        }
        <span class="contents">
          <ng-container [ngTemplateOutlet]="projectedContent"></ng-container>
        </span>
      </button>
    }
  `,
})
export class AppButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly routerLink = input<string | readonly (string | number)[] | null>(null);
  readonly href = input<string | null>(null);
  readonly target = input<string | null>(null);
  readonly rel = input<string | null>(null);

  readonly buttonClass = computed(() => {
    const variantClass = this.resolveVariant(this.variant());
    const sizeClass = this.resolveSize(this.size());
    const widthClass = this.block() ? 'w-full' : '';
    const disabledClass = this.isDisabled() ? 'pointer-events-none opacity-55' : '';

    return [
      'inline-flex min-w-0 max-w-full box-border items-center justify-center gap-2 rounded-[13px] text-center font-semibold leading-tight whitespace-normal no-underline transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25',
      'active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none',
      variantClass,
      sizeClass,
      widthClass,
      disabledClass,
    ]
      .filter(Boolean)
      .join(' ');
  });

  readonly isDisabled = computed(() => this.disabled() || this.loading());

  private resolveVariant(variant: ButtonVariant): string {
    switch (variant) {
      case 'secondary':
        return 'border border-primary-200 bg-primary-50 text-primary-800 shadow-none hover:bg-primary-100';
      case 'ghost':
        return 'border border-slate-200 bg-transparent text-primary-700 shadow-none hover:bg-slate-50';
      case 'danger':
        return 'bg-danger text-white shadow-sm hover:bg-red-600';
      case 'success':
        return 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700';
      default:
        return 'bg-primary-700 text-white shadow-sm hover:bg-primary-600';
    }
  }

  private resolveSize(size: ButtonSize): string {
    switch (size) {
      case 'sm':
        return 'min-h-9 px-3.5 text-xs';
      case 'lg':
        return 'min-h-12 px-[18px] text-sm';
      default:
        return 'min-h-11 px-4 text-sm';
    }
  }
}
