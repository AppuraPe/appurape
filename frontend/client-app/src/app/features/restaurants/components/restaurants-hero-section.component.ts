import { Component, EventEmitter, input, Output } from '@angular/core';

@Component({
  selector: 'app-restaurants-hero-section',
  standalone: true,
  template: `
    <section class="relative min-h-[100svh] overflow-hidden bg-cover bg-center text-white" [style.background-image]="'url(' + backgroundImageUrl() + ')'">
      <div class="absolute inset-0"></div>
      <div class="absolute inset-0" [class]="overlayClass()"></div>
      <div class="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1160px] items-center justify-center px-4 py-20 sm:px-6 md:px-8">
        <div class="mx-auto w-full max-w-[640px] text-center md:mx-0 md:max-w-[560px]">
          <h1 class="font-ui text-4xl font-semibold leading-[0.96] tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)] sm:text-[2.8rem] md:text-[3.25rem]">
            {{ title() }}
          </h1>
          <p class="mt-3 font-ui text-base text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:text-lg">
            {{ subtitle() }}
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center rounded-full bg-[#ff6f69] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,111,105,0.35)] transition hover:brightness-105"
              (click)="primaryClick.emit()"
            >
              {{ primaryChipLabel() }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center rounded-full border border-white/45 bg-white/15 px-5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              (click)="secondaryClick.emit()"
            >
              {{ secondaryChipLabel() }}
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class RestaurantsHeroSectionComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly primaryChipLabel = input.required<string>();
  readonly secondaryChipLabel = input.required<string>();
  readonly backgroundImageUrl = input.required<string>();
  readonly overlayStrength = input<'soft' | 'medium' | 'strong'>('medium');

  @Output() readonly primaryClick = new EventEmitter<void>();
  @Output() readonly secondaryClick = new EventEmitter<void>();

  overlayClass(): string {
    if (this.overlayStrength() === 'soft') {
      return 'bg-gradient-to-br from-black/34 via-black/16 to-black/24';
    }
    if (this.overlayStrength() === 'strong') {
      return 'bg-gradient-to-br from-black/58 via-black/34 to-black/44';
    }
    return 'bg-gradient-to-br from-black/46 via-black/24 to-black/34';
  }
}
