import { Component, EventEmitter, Output, input } from '@angular/core';
import { LucideAngularModule, Search, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-restaurants-hero-section',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <section class="relative overflow-hidden text-white">
      <div class="absolute inset-0 bg-cover bg-center" [style.background-image]="'url(' + backgroundImageUrl() + ')'" aria-hidden="true"></div>
      <div class="absolute inset-0" [class]="overlayClass()"></div>

      <div class="relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-8 pt-3 sm:px-6 lg:px-8">
        <div class="overflow-hidden rounded-[28px] border border-white/12 bg-[#06192b]/74 px-4 py-5 shadow-[0_12px_30px_rgba(6,25,43,0.18)] backdrop-blur-sm sm:px-5 sm:py-6">
          <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div class="min-w-0 max-w-3xl">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/90">
                  <lucide-angular class="h-3.5 w-3.5 text-[#ffb2ab]" [img]="sparklesIcon" aria-hidden="true"></lucide-angular>
                  AppuraPe
                </span>
                <span class="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/75">
                  Móvil primero
                </span>
              </div>

              <h1 class="max-w-3xl text-balance font-display text-[2rem] font-black leading-[0.94] tracking-[-0.05em] text-white sm:text-[2.3rem] lg:text-[2.7rem]">
                {{ title() }}
              </h1>
              @if (subtitle()) {
                <p class="mt-3 max-w-xl text-sm leading-6 text-white/82 sm:text-[0.95rem]">
                  {{ subtitle() }}
                </p>
              }
            </div>

            <div class="hidden rounded-[22px] border border-white/10 bg-white/8 p-4 lg:grid">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#ffb2ab]">Explora</span>
              <p class="mt-2 text-sm leading-6 text-white/82">
                Restaurantes, platos y pedido en un flujo más claro y compacto.
              </p>
            </div>
          </div>

          @if (primaryChipLabel() || secondaryChipLabel()) {
            <div class="mt-4 flex flex-wrap gap-2.5">
              @if (primaryChipLabel()) {
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-primary-700 transition hover:bg-primary-50"
                  (click)="primaryClick.emit()"
                >
                  <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
                  {{ primaryChipLabel() }}
                </button>
              }
              @if (secondaryChipLabel()) {
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center justify-center rounded-full border border-white/14 bg-white/10 px-4 text-sm font-black text-white/90 transition hover:bg-white/16"
                  (click)="secondaryClick.emit()"
                >
                  {{ secondaryChipLabel() }}
                </button>
              }
            </div>
          }
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

  readonly searchIcon = Search;
  readonly sparklesIcon = Sparkles;

  overlayClass(): string {
    if (this.overlayStrength() === 'soft') {
      return 'bg-[radial-gradient(circle_at_top_left,rgba(229,27,35,0.2),transparent_35%),linear-gradient(180deg,rgba(6,25,43,0.66),rgba(6,25,43,0.5))]';
    }
    if (this.overlayStrength() === 'strong') {
      return 'bg-[radial-gradient(circle_at_top_left,rgba(229,27,35,0.28),transparent_38%),linear-gradient(180deg,rgba(6,25,43,0.84),rgba(6,25,43,0.62))]';
    }
    return 'bg-[radial-gradient(circle_at_top_left,rgba(229,27,35,0.24),transparent_36%),linear-gradient(180deg,rgba(6,25,43,0.76),rgba(6,25,43,0.54))]';
  }
}
