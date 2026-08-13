import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({ selector: 'app-account-privacy-page', standalone: true, imports: [RouterLink, AppButtonComponent, AppSurfaceCardComponent, PageHeaderComponent], template: `
  <section class="grid gap-4"><app-page-header eyebrow="Cuenta" title="Privacidad y seguridad" subtitle="Consulta las condiciones o gestiona la eliminación de tu cuenta." /><app-surface-card variant="page" extraClass="grid gap-3 p-4"><a class="rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-900 no-underline" routerLink="/privacy">Política de privacidad</a><a class="rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-900 no-underline" routerLink="/terms">Términos y condiciones</a><app-button variant="danger" routerLink="/account-deletion">Solicitar eliminación de cuenta</app-button></app-surface-card></section>` })
export class AccountPrivacyPageComponent {}
