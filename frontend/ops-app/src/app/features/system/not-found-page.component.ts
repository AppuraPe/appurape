import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowLeft, Compass, Home, LucideAngularModule, SearchX } from 'lucide-angular';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PageHeaderComponent, AppButtonComponent, AppNoticeComponent, AppSurfaceCardComponent],
  template: `
    <section class="mx-auto grid min-h-[70vh] w-full max-w-4xl place-items-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <app-surface-card variant="hero" extraClass="w-full max-w-3xl">
        <div class="grid gap-5 text-center md:justify-items-center md:gap-8">
          <div class="mx-auto hidden h-20 w-20 place-items-center rounded-[28px] bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] md:grid">
            <lucide-angular class="h-10 w-10" [img]="searchXIcon" aria-hidden="true"></lucide-angular>
          </div>

          <app-page-header
            eyebrow="404"
            title="No encontramos esta página"
            subtitle="La ruta no existe, cambió o ya no está disponible dentro de la experiencia actual de AppuraPe."
          />

          <app-notice
            class="hidden md:block"
            tone="info"
            title="Recupera el rumbo rápido"
            message="Puedes volver al inicio, entrar al login o seguir explorando los módulos disponibles desde tu cuenta actual."
          />

          <div class="hidden gap-4 rounded-[24px] border border-slate-200 bg-white/90 p-5 text-left shadow-sm md:grid">
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-700">
                <lucide-angular class="h-5 w-5" [img]="compassIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div class="grid gap-1">
                <strong class="text-sm font-black uppercase tracking-[0.12em] text-primary-700">Sugerencia</strong>
                <p class="text-sm leading-6 text-text-muted">
                  Si llegaste desde un enlace antiguo, vuelve al panel principal y navega desde el menú actualizado para evitar rutas obsoletas.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <app-button size="lg" [routerLink]="'/'">
              <lucide-angular class="h-4 w-4" [img]="homeIcon" aria-hidden="true"></lucide-angular>
              Ir al inicio
            </app-button>
            <app-button size="lg" variant="ghost" [routerLink]="'/login'">
              <lucide-angular class="h-4 w-4" [img]="arrowLeftIcon" aria-hidden="true"></lucide-angular>
              Volver al login
            </app-button>
          </div>
        </div>
      </app-surface-card>
    </section>
  `,
})
export class NotFoundPageComponent {
  readonly searchXIcon = SearchX;
  readonly compassIcon = Compass;
  readonly homeIcon = Home;
  readonly arrowLeftIcon = ArrowLeft;
}
