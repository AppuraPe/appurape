import { Component, EventEmitter, Output, input } from '@angular/core';
import { Clock3, LucideAngularModule, MapPin, Store } from 'lucide-angular';

@Component({
  selector: 'app-businesses-hero-section',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <section class="relative overflow-hidden text-white">
      <div class="relative z-10 mx-auto w-full max-w-[480px] px-3 pb-2 pt-1 sm:hidden">
        <div class="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#0a2039_0%,#102b4b_100%)] px-4 py-3.5 shadow-[0_18px_42px_rgba(6,25,43,0.16)] h-[clamp(125px,19dvh,150px)] min-h-[125px] max-h-[150px]">
          <div class="hero-content relative z-10 w-[calc(100%-clamp(80px,27vw,115px))]">
            <h1 class="text-balance font-display text-[clamp(21px,6.4vw,27px)] font-extrabold leading-[0.96] tracking-[-0.03em] text-white">
              Explorar negocios<br />
              sin perder tiempo
            </h1>
            @if (subtitle()) {
              <p class="mt-2 max-w-[170px] text-[clamp(11px,3.4vw,13px)] leading-[1.25] text-white/86">
                {{ subtitle() }}
              </p>
            }
            <div class="mt-[10px] h-1 w-[42px] rounded-full bg-primary-600"></div>
          </div>

          <img
            class="hero-illustration absolute right-[10px] top-1/2 z-[1] block h-[clamp(76px,14dvh,105px)] w-[clamp(76px,26vw,108px)] -translate-y-1/2 object-contain object-center"
            [src]="heroIllustrationUrl"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>

      <div class="relative z-10 mx-auto hidden w-full max-w-[1200px] px-4 pb-1 pt-1 sm:block sm:px-6 lg:px-0 lg:pb-0 lg:pt-1">
        <div class="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0a2039_0%,#0d2844_46%,#102b4b_100%)] px-6 py-8 shadow-[0_22px_48px_rgba(6,25,43,0.16)] lg:h-[170px] lg:min-h-0 lg:px-10 lg:py-5 lg:rounded-[26px]">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(229,27,35,0.14),transparent_32%)]" aria-hidden="true"></div>

          <div class="relative z-10 grid gap-8 lg:h-full lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
            <div class="min-w-0 max-w-3xl">
              <h1 class="text-balance font-display text-[2.2rem] font-black leading-[0.96] tracking-[-0.06em] text-white sm:text-[3rem] lg:m-0 lg:max-w-[650px] lg:text-[clamp(42px,4vw,52px)] lg:leading-[0.98] xl:text-[clamp(42px,4vw,52px)]">
                {{ title() }}
              </h1>
              @if (subtitle()) {
                <p class="mt-5 max-w-2xl text-[1.02rem] leading-7 text-white/86 sm:text-[1.08rem] lg:mt-[14px] lg:text-[16px] lg:leading-6">
                  {{ subtitle() }}
                </p>
              }
              <div class="mt-8 h-1.5 w-24 rounded-full bg-primary-600 lg:mt-[14px]"></div>
            </div>

            <div class="relative mx-auto flex h-[150px] w-full max-w-[330px] items-center justify-center lg:h-[150px] lg:max-w-[390px]">
              <img
                class="block max-h-[165px] w-full scale-[1.25] object-contain object-center"
                [src]="heroIllustrationUrl"
                alt=""
                aria-hidden="true"
              />
              <div class="absolute left-2 top-4 grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-white shadow-[0_14px_28px_rgba(229,27,35,0.24)]">
                <lucide-angular class="h-4.5 w-4.5" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div class="absolute bottom-2 right-1 grid h-16 w-16 place-items-center rounded-full border-[7px] border-primary-600 bg-white text-[#0f2742] shadow-[0_18px_32px_rgba(229,27,35,0.26)]">
                <lucide-angular class="h-7 w-7" [img]="clockIcon" aria-hidden="true"></lucide-angular>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class BusinessesHeroSectionComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly primaryChipLabel = input.required<string>();
  readonly secondaryChipLabel = input.required<string>();
  readonly backgroundImageUrl = input.required<string>();
  readonly overlayStrength = input<'soft' | 'medium' | 'strong'>('medium');

  @Output() readonly primaryClick = new EventEmitter<void>();
  @Output() readonly secondaryClick = new EventEmitter<void>();

  readonly heroIllustrationUrl = '/img/business-hero-illustration.svg';
  readonly storeIcon = Store;
  readonly mapPinIcon = MapPin;
  readonly clockIcon = Clock3;

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
