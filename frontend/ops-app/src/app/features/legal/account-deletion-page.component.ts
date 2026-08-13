import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LegalApiService } from '../../core/services/legal-api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({ selector: 'app-account-deletion-page', standalone: true, imports: [FormsModule, RouterLink, AppButtonComponent, AppSurfaceCardComponent], template: `
  <main class="mx-auto grid min-h-dvh w-full max-w-xl place-content-center gap-4 overflow-x-hidden px-4 py-6">
    <app-surface-card variant="page" extraClass="grid gap-5 p-5 sm:p-7">
      <div><p class="text-xs font-black uppercase tracking-widest text-red-600">Privacidad</p><h1 class="mt-2 text-2xl font-black">{{ cancellationMode() ? 'Cancelar eliminación' : 'Eliminar mi cuenta' }}</h1><p class="mt-2 text-sm leading-6 text-slate-600">{{ cancellationMode() ? 'Enviaremos un código para recuperar el acceso antes de la fecha programada.' : 'Enviaremos un código a tu correo. Después de confirmarlo tendrás siete días para cancelar antes de anonimizar la cuenta.' }}</p></div>
      <label class="grid gap-2"><span class="text-sm font-bold">Correo de la cuenta</span><input type="email" [(ngModel)]="email" /></label>
      @if (codeRequested()) { <label class="grid gap-2"><span class="text-sm font-bold">Código de seis dígitos</span><input inputmode="numeric" maxlength="6" [(ngModel)]="code" /></label> }
      @if (message()) { <p class="rounded-2xl bg-slate-100 p-3 text-sm">{{ message() }}</p> }
      @if (!codeRequested()) { <app-button [variant]="cancellationMode() ? 'primary' : 'danger'" block [disabled]="busy() || !email.trim()" (click)="start()">{{ cancellationMode() ? 'Enviar código de cancelación' : 'Solicitar eliminación' }}</app-button> }
      @else { <app-button [variant]="cancellationMode() ? 'primary' : 'danger'" block [disabled]="busy() || code.length !== 6" (click)="confirm()">{{ cancellationMode() ? 'Recuperar cuenta' : 'Confirmar eliminación' }}</app-button> }
      <button class="text-center text-sm font-bold text-primary-700" type="button" (click)="switchMode()">{{ cancellationMode() ? 'Quiero solicitar la eliminación' : 'Ya solicité eliminarla y quiero cancelar' }}</button>
      <a class="text-center text-sm font-bold text-primary-700" routerLink="/privacy">Leer política de privacidad</a>
    </app-surface-card>
  </main>` })
export class AccountDeletionPageComponent {
  private readonly api = inject(LegalApiService); private readonly auth = inject(AuthService); email = ''; code = ''; readonly busy = signal(false); readonly codeRequested = signal(false); readonly message = signal(''); readonly cancellationMode = signal(false);
  start(): void { this.busy.set(true); const request = this.cancellationMode() ? this.api.startDeletionCancellation(this.email) : this.api.startDeletion(this.email); request.subscribe({ next: () => { this.codeRequested.set(true); this.message.set('Si la cuenta existe, enviamos el código al correo.'); this.busy.set(false); }, error: () => { this.message.set('No se pudo iniciar la solicitud.'); this.busy.set(false); } }); }
  confirm(): void { this.busy.set(true); const request = this.cancellationMode() ? this.api.confirmDeletionCancellation(this.email, this.code) : this.api.confirmDeletion(this.email, this.code); request.subscribe({ next: x => { this.message.set(this.cancellationMode() ? 'La eliminación fue cancelada. Ya puedes iniciar sesión.' : `Eliminación programada para ${new Date(x.scheduledForUtc!).toLocaleDateString('es-PE')}.`); this.auth.logout(); this.busy.set(false); }, error: () => { this.message.set('Código inválido o vencido.'); this.busy.set(false); } }); }
  switchMode(): void { this.cancellationMode.update(x => !x); this.codeRequested.set(false); this.code = ''; this.message.set(''); }
}
