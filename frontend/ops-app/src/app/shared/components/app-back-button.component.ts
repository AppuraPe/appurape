import { Component, inject, input } from '@angular/core';
import { ArrowLeft, LucideAngularModule } from 'lucide-angular';
import { AppNavigationService } from '../../core/services/app-navigation.service';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button
      type="button"
      class="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#ddc8c1] bg-white px-3.5 py-2 text-sm font-semibold text-loreto-carbon shadow-none transition hover:border-primary-200 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
      (click)="goBack()"
    >
      <lucide-angular class="h-4 w-4 shrink-0" [img]="arrowLeftIcon" aria-hidden="true"></lucide-angular>
      <span class="truncate">{{ label() }}</span>
    </button>
  `,
})
export class AppBackButtonComponent {
  private readonly navigation = inject(AppNavigationService);

  readonly fallbackUrl = input('/restaurants');
  readonly label = input('Volver');
  readonly arrowLeftIcon = ArrowLeft;

  goBack(): void {
    this.navigation.goBack(this.fallbackUrl());
  }
}
