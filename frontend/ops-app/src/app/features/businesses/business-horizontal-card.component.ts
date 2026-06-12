import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Clock3 } from 'lucide-angular';
import { BusinessListItemResponse } from '../../core/models/businesses.models';
import { formatTimeSpan } from '../../core/utils/api-utils';

@Component({
  selector: 'app-business-horizontal-card',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <a
      class="w-[78vw] min-w-[78vw] max-w-[320px] snap-start overflow-hidden rounded-2xl border border-red-100 bg-white no-underline shadow-sm"
      [routerLink]="['/businesses', business().id]"
    >
      <div class="h-28 w-full overflow-hidden bg-slate-100">
        <img class="h-full w-full object-cover object-center" [src]="business().logoUrl || '/img/business-placeholder.svg'" [alt]="business().name" />
      </div>

      <div class="min-w-0 p-3">
        <h3 class="line-clamp-1 text-sm font-bold text-slate-950">{{ business().name }}</h3>
        <p class="mt-1 truncate text-xs text-slate-500">
          {{ business().businessTypeName || business().description || 'Negocio local' }} · {{ business().zoneName }}
        </p>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span class="inline-flex items-center gap-1.5">
            <lucide-angular class="h-3.5 w-3.5 text-red-500" [img]="clockIcon" aria-hidden="true"></lucide-angular>
            <span>{{ scheduleLabel() }}</span>
          </span>
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

  scheduleLabel(): string {
    return `${formatTimeSpan(this.business().openTime)} - ${formatTimeSpan(this.business().closeTime)}`;
  }
}
