import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LegalApiService } from '../../core/services/legal-api.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({ selector: 'app-account-deletion-pending-page', standalone: true, imports: [AppButtonComponent, AppSurfaceCardComponent], template: `
  <main class="mx-auto grid min-h-dvh w-full max-w-lg place-content-center px-4 py-6"><app-surface-card variant="page" extraClass="grid gap-4 p-5 sm:p-7"><p class="text-xs font-black uppercase tracking-widest text-red-600">Eliminación programada</p><h1 class="text-2xl font-black">Tu cuenta está en periodo de espera</h1><p class="text-sm leading-6 text-slate-600">La información se anonimizará después de siete días. Puedes cancelar ahora y recuperar el acceso.</p>@if (scheduled()) { <p class="rounded-2xl bg-slate-100 p-3 text-sm font-bold">Fecha programada: {{ scheduled() }}</p> }<app-button block (click)="cancel()" [disabled]="busy()">Cancelar eliminación</app-button><app-button variant="ghost" block (click)="logout()">Cerrar sesión</app-button></app-surface-card></main>` })
export class AccountDeletionPendingPageComponent {
  private readonly api = inject(LegalApiService); private readonly auth = inject(AuthService); private readonly router = inject(Router); readonly busy = signal(false); readonly scheduled = signal('');
  constructor() { this.api.deletionStatus().subscribe(x => this.scheduled.set(x.scheduledForUtc ? new Date(x.scheduledForUtc).toLocaleString('es-PE') : '')); }
  cancel(): void { this.busy.set(true); this.api.cancelDeletion().subscribe({ next: () => { this.auth.logout(); void this.router.navigateByUrl('/login'); }, error: () => this.busy.set(false) }); }
  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }
}
