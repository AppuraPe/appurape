import { Component, input } from '@angular/core';
import { BusinessListItemResponse } from '../../core/models/businesses.models';
import { BusinessesBusinessCardComponent } from './businesses-business-card.component';
import { formatTimeSpan } from '../../core/utils/api-utils';

@Component({
  selector: 'app-filtered-business-list',
  standalone: true,
  imports: [BusinessesBusinessCardComponent],
  template: `
    <div class="flex w-full flex-col gap-3 px-4 lg:hidden">
      @for (business of businesses(); track business.id) {
        <app-businesses-business-card
          [name]="business.name"
          [categoryLabel]="business.businessTypeName || business.description || ''"
          [zoneName]="business.zoneName"
          [isOpenNowLabel]="business.isOpenNow ? 'Abierto' : 'Cerrado'"
          [scheduleLabel]="formatSchedule(business.openTime, business.closeTime)"
          [imageUrl]="business.logoUrl"
          [actionLabel]="'Ver negocio'"
          [actionRoute]="['/businesses', business.id]"
        />
      }
    </div>
  `,
})
export class FilteredBusinessListComponent {
  readonly businesses = input<BusinessListItemResponse[]>([]);

  formatSchedule(openTime: string, closeTime: string): string {
    return `${formatTimeSpan(openTime)} - ${formatTimeSpan(closeTime)}`;
  }
}
