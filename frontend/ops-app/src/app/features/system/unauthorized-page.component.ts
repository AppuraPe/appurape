import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowLeft, Home, LockKeyhole, LucideAngularModule, ShieldAlert } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PageHeaderComponent, AppButtonComponent, AppNoticeComponent, AppSurfaceCardComponent],
  template: `
    <section class="mx-auto grid min-h-[70vh] w-full max-w-4xl place-items-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <app-surface-card variant="hero" extraClass="w-full max-w-3xl">
        <div class="grid gap-5 text-center md:justify-items-center md:gap-8">
          <div class="mx-auto hidden h-20 w-20 place-items-center rounded-[28px] bg-orange-500 text-white shadow-[0_20px_50px_rgba(249,115,22,0.22)] md:grid">
            <lucide-angular class="h-10 w-10" [img]="shieldAlertIcon" aria-hidden="true"></lucide-angular>
          </div>

          <app-page-header
            eyebrow="Acceso protegido"
            title="No tienes permiso para entrar aquí"
            subtitle="Tu sesión está activa, pero el rol actual no puede abrir esta vista dentro de AppuraPe."
          />

          <app-notice
            class="hidden md:block"
            tone="warning"
            title="Revisa tu tipo de cuenta"
            message="Si necesitas esta pantalla, inicia sesión con una cuenta Admin, Restaurant o Driver según corresponda."
          />

          <div class="hidden gap-4 rounded-[24px] border border-slate-200 bg-white/90 p-5 text-left shadow-sm md:grid">
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-700">
                <lucide-angular class="h-5 w-5" [img]="lockIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div class="grid gap-1">
                <strong class="text-sm font-black uppercase tracking-[0.12em] text-primary-700">Siguiente paso recomendado</strong>
                <p class="text-sm leading-6 text-text-muted">
                  Vuelve al login si quieres cambiar de cuenta, o regresa al inicio para seguir navegando dentro del módulo permitido para tu rol actual.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <app-button size="lg" [routerLink]="'/login'">
              <lucide-angular class="h-4 w-4" [img]="arrowLeftIcon" aria-hidden="true"></lucide-angular>
              Ir al login
            </app-button>
            <app-button size="lg" variant="ghost" [routerLink]="defaultRoute()">
              <lucide-angular class="h-4 w-4" [img]="homeIcon" aria-hidden="true"></lucide-angular>
              Ir al inicio
            </app-button>
          </div>
        </div>
      </app-surface-card>
    </section>
  `,
})
export class UnauthorizedPageComponent {
  private readonly authService = inject(AuthService);

  readonly shieldAlertIcon = ShieldAlert;
  readonly lockIcon = LockKeyhole;
  readonly arrowLeftIcon = ArrowLeft;
  readonly homeIcon = Home;

  readonly defaultRoute = computed(() => this.authService.getDefaultRoute());
}
