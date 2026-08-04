import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

type SurfaceVariant = 'default' | 'page' | 'hero' | 'soft' | 'stat';

@Component({
  selector: 'app-surface-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <article [ngClass]="surfaceClass()">
      <ng-content />
    </article>
  `,
})
export class AppSurfaceCardComponent {
  readonly variant = input<SurfaceVariant>('default');
  readonly extraClass = input('');

  readonly surfaceClass = computed(() => {
    const baseClass = (() => {
      switch (this.variant()) {
        case 'page':
          return 'rounded-[26px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:rounded-[28px] sm:p-5 lg:rounded-[32px] lg:p-7 lg:shadow-[0_18px_44px_rgba(15,23,42,0.1)]';
        case 'hero':
          return 'rounded-[26px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:p-6 lg:rounded-[34px] lg:p-8 lg:shadow-[0_18px_44px_rgba(15,23,42,0.1)]';
        case 'soft':
          return 'rounded-2xl border border-slate-200 bg-slate-50/85 p-4 shadow-sm sm:rounded-[22px] sm:p-5 lg:rounded-[24px] lg:shadow-[0_12px_28px_rgba(15,23,42,0.06)]';
        case 'stat':
          return 'grid gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[20px] sm:p-4 lg:rounded-[22px] lg:shadow-[0_12px_28px_rgba(15,23,42,0.06)]';
        default:
          return 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[22px] sm:p-5 lg:rounded-[24px] lg:shadow-[0_12px_28px_rgba(15,23,42,0.06)]';
      }
    })();

    const motionClass =
      this.variant() === 'page' || this.variant() === 'hero'
        ? 'transition-transform duration-300 ease-out md:will-change-transform md:hover:-translate-y-1'
        : 'transition-all duration-300 ease-out md:will-change-transform md:hover:-translate-y-0.5 md:hover:shadow-[0_18px_34px_rgba(6,25,43,0.12)]';

    return [baseClass, motionClass, this.extraClass()].filter(Boolean).join(' ');
  });
}
