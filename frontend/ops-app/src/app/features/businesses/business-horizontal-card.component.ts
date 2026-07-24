import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock3, LucideAngularModule } from 'lucide-angular';
import { BusinessListItemResponse } from '../../core/models/businesses.models';
import { formatTimeSpan, hasText } from '../../core/utils/api-utils';

@Component({
  selector: 'app-business-horizontal-card',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  host: {
    class: 'block w-[46vw] min-w-[46vw] max-w-[165px] shrink-0 snap-start -ml-1 first:ml-0 min-[390px]:w-[44vw] min-[390px]:min-w-[44vw]',
  },
  template: `
    <a
      class="block h-full w-full overflow-hidden rounded-2xl border border-slate-100 bg-white no-underline shadow-sm"
      [routerLink]="['/businesses', business().id]"
    >
      <div class="h-14 w-full overflow-hidden bg-slate-100">
        <img
          class="h-full w-full object-cover object-center"
          [src]="business().logoUrl || placeholderImage"
          alt=""
          (error)="handleImageError($event)"
        />
      </div>

      <div class="min-w-0 p-1.5">
        <h3 class="line-clamp-1 text-[11px] font-bold text-slate-950">{{ business().name }}</h3>

        @if (categoryZoneLabel()) {
          <p class="mt-1 truncate text-[9px] text-slate-500">
            {{ categoryZoneLabel() }}
          </p>
        }

        <div class="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] text-slate-600">
          <span class="inline-flex items-center gap-1.5">
            <lucide-angular class="h-4 w-4 text-red-500" [img]="clockIcon" aria-hidden="true"></lucide-angular>
            <span>{{ scheduleLabel() }}</span>
          </span>
          <span class="text-slate-300">|</span>
          <span [class.text-emerald-600]="business().isOpenNow" [class.text-red-500]="!business().isOpenNow">
            {{ business().isOpenNow ? 'Abierto' : 'Cerrado' }}
          </span>
        </div>
      </div>
    </a>
  `,
})
export class BusinessHorizontalCardComponent {
  readonly business = input.required<BusinessListItemResponse>();
  readonly clockIcon = Clock3;
  readonly placeholderImage = '/img/business-placeholder.svg';

  categoryZoneLabel(): string {
    return [this.business().businessTypeName, this.business().zoneName].filter((value) => hasText(value)).join(' - ');
  }

  scheduleLabel(): string {
    return `${formatTimeSpan(this.business().openTime)} - ${formatTimeSpan(this.business().closeTime)}`;
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith(this.placeholderImage)) {
      return;
    }

    image.src = this.placeholderImage;
  }
}
