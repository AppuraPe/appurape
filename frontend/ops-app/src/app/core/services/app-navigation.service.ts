import { Location } from '@angular/common';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppNavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  private readonly routeStack = signal<string[]>([]);
  private lastNavigationTrigger: NavigationStart['navigationTrigger'] = 'imperative';

  readonly previousUrl = computed(() => {
    const stack = this.routeStack();
    return stack.length > 1 ? stack[stack.length - 2] : null;
  });

  readonly canGoBack = computed(() => this.previousUrl() !== null);

  constructor() {
    this.routeStack.set([this.router.url || '/restaurants']);

    this.router.events
      .pipe(
        filter((event): event is NavigationStart | NavigationEnd => event instanceof NavigationStart || event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.lastNavigationTrigger = event.navigationTrigger;
          return;
        }

        this.syncRouteStack(event.urlAfterRedirects);
      });
  }

  goBack(fallbackUrl = '/restaurants'): void {
    if (this.previousUrl()) {
      this.location.back();
      return;
    }

    if (this.router.url !== fallbackUrl) {
      void this.router.navigateByUrl(fallbackUrl);
    }
  }

  private syncRouteStack(url: string): void {
    this.routeStack.update((stack) => {
      if (!stack.length) {
        return [url];
      }

      if (this.lastNavigationTrigger === 'popstate') {
        const previousUrl = stack[stack.length - 2];

        if (previousUrl === url) {
          return stack.slice(0, -1);
        }

        const existingIndex = stack.lastIndexOf(url);
        if (existingIndex >= 0) {
          return stack.slice(0, existingIndex + 1);
        }
      }

      if (stack[stack.length - 1] === url) {
        return stack;
      }

      return [...stack.slice(-19), url];
    });
  }
}
