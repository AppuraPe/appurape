import { Component, EventEmitter, Output, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bell, LucideAngularModule, Search, SlidersHorizontal } from 'lucide-angular';

@Component({
  selector: 'app-mobile-explore-header',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <header class="lg:hidden">
      <div class="flex w-full min-w-0 items-center gap-2 px-4 pt-3" [formGroup]="form()">
        <div class="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm">
          <lucide-angular class="h-5 w-5 shrink-0 text-slate-500" [img]="searchIcon" aria-hidden="true"></lucide-angular>
          <input
            type="search"
            formControlName="q"
            placeholder="Busca negocios o productos"
            autocomplete="off"
            class="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
          />
        </div>

        @if (showNotifications()) {
          <a
            routerLink="/account/notifications"
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
            aria-label="Notificaciones"
          >
            <lucide-angular class="h-5 w-5" [img]="bellIcon" aria-hidden="true"></lucide-angular>
            @if (unreadCount() > 0) {
              <span class="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-slate-50 bg-primary-600 px-1 text-[9px] font-black leading-none text-white">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
            }
          </a>
        }

        <button
          type="button"
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
          aria-label="Abrir filtros"
          (click)="openFilters.emit()"
        >
          <lucide-angular class="h-5 w-5" [img]="slidersIcon" aria-hidden="true"></lucide-angular>
        </button>
      </div>
    </header>
  `,
})
export class MobileExploreHeaderComponent {
  readonly form = input.required<FormGroup>();
  readonly showNotifications = input(false);
  readonly unreadCount = input(0);

  @Output() readonly openFilters = new EventEmitter<void>();

  readonly searchIcon = Search;
  readonly bellIcon = Bell;
  readonly slidersIcon = SlidersHorizontal;
}
