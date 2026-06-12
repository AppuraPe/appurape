import { Component, EventEmitter, Output, input } from '@angular/core';
import { ArrowRight, LucideAngularModule } from 'lucide-angular';
import { BusinessCategorySectionResponse } from '../../core/models/businesses.models';
import { BusinessHorizontalCardComponent } from './business-horizontal-card.component';

@Component({
  selector: 'app-business-category-section',
  standalone: true,
  imports: [LucideAngularModule, BusinessHorizontalCardComponent],
  template: `
    <section class="mt-4 w-full lg:hidden">
      <div class="flex items-center justify-between px-4">
        <h2 class="min-w-0 truncate text-xl font-extrabold text-slate-950">{{ section().category.name }}</h2>
        <button type="button" class="flex shrink-0 items-center gap-1 text-sm text-red-500" (click)="viewAll.emit(section().category.id)">
          Ver todos
          <lucide-angular class="h-4 w-4" [img]="arrowRightIcon" aria-hidden="true"></lucide-angular>
        </button>
      </div>

      <div class="mt-2.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        @for (business of section().businesses; track business.id) {
          <app-business-horizontal-card [business]="business" />
        }
      </div>
    </section>
  `,
})
export class BusinessCategorySectionComponent {
  readonly section = input.required<BusinessCategorySectionResponse>();

  @Output() readonly viewAll = new EventEmitter<string>();

  readonly arrowRightIcon = ArrowRight;
}
