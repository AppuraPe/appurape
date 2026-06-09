import { NgClass } from '@angular/common';
import { booleanAttribute, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, RouterLink],
  template: `
    @if (routerLink()) {
      <a [routerLink]="routerLink()!" [ngClass]="buttonClass()">
        <ng-content />
      </a>
    } @else if (href()) {
      <a [href]="href()!" [attr.target]="target() || null" [attr.rel]="rel() || null" [ngClass]="buttonClass()">
        <ng-content />
      </a>
    } @else {
      <button [type]="type()" [disabled]="disabled()" [ngClass]="buttonClass()">
        <ng-content />
      </button>
    }
  `,
})
export class AppButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly routerLink = input<string | readonly (string | number)[] | null>(null);
  readonly href = input<string | null>(null);
  readonly target = input<string | null>(null);
  readonly rel = input<string | null>(null);

  readonly buttonClass = computed(() => {
    const variantClass = this.resolveVariant(this.variant());
    const sizeClass = this.resolveSize(this.size());
    const widthClass = this.block() ? 'w-full' : '';
    const disabledClass = this.disabled() ? 'pointer-events-none opacity-55' : '';

    return [
      'inline-flex items-center justify-center gap-2 rounded-full font-extrabold no-underline transition-all duration-300 ease-out will-change-transform',
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

  private resolveVariant(variant: ButtonVariant): string {
    switch (variant) {
      case 'secondary':
        return 'border border-[#eddad4] bg-surface-soft text-loreto-carbon shadow-none hover:-translate-y-0.5 hover:bg-[#fff0ec] hover:shadow-[0_14px_26px_rgba(6,25,43,0.08)]';
      case 'ghost':
        return 'border border-[#d9c0b8] bg-transparent text-primary-700 shadow-none hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_22px_rgba(6,25,43,0.06)]';
      case 'danger':
        return 'bg-danger text-white shadow-lg shadow-red-900/10 hover:-translate-y-0.5 hover:bg-[#a50f19] hover:shadow-[0_18px_28px_rgba(193,18,31,0.24)]';
      default:
        return 'bg-primary-700 text-white shadow-lg shadow-primary-700/20 hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-[0_20px_34px_rgba(229,27,35,0.28)]';
    }
  }

  private resolveSize(size: ButtonSize): string {
    switch (size) {
      case 'sm':
        return 'min-h-10 px-4 text-xs';
      case 'lg':
        return 'min-h-13 px-6 text-base';
      default:
        return 'min-h-11 px-5 text-sm';
    }
  }
}
