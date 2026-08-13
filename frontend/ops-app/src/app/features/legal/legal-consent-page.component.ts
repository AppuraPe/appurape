import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LegalApiService } from '../../core/services/legal-api.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({ selector: 'app-legal-consent-page', standalone: true, imports: [RouterLink, AppButtonComponent, AppSurfaceCardComponent], template: `
  <main class="mx-auto grid min-h-dvh w-full max-w-2xl place-content-center gap-4 overflow-x-hidden px-4 py-6">
    <app-surface-card variant="page" extraClass="grid min-w-0 gap-5 p-5 sm:p-7">
      <div><p class="text-xs font-black uppercase tracking-widest text-primary-700">Privacidad y condiciones</p><h1 class="mt-2 text-2xl font-black">Revisa las condiciones vigentes</h1><p class="mt-2 text-sm leading-6 text-slate-600">Para continuar debes aceptar cada documento aplicable a tu cuenta.</p></div>
      @if (loading()) { <p class="text-sm text-slate-500">Cargando documentos...</p> } @else {
        <div class="grid gap-3">
          @for (document of documents(); track document.id) {
            <label class="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 p-4"><input class="mt-1 h-5 w-5 shrink-0" type="checkbox" [checked]="selected().has(document.id)" (change)="toggle(document.id)" /><span class="min-w-0 flex-1"><strong class="block break-words text-sm">{{ document.title }}</strong><span class="text-xs text-slate-500">Versión {{ document.version }}</span><a class="mt-1 block text-xs font-bold text-primary-700" [routerLink]="'/legal/document/' + document.slug" target="_blank">Leer documento</a></span></label>
          }
        </div>
        @if (error()) { <p class="text-sm font-semibold text-red-700">{{ error() }}</p> }
        <app-button block [disabled]="saving() || selected().size !== documents().length" (click)="acceptAll()">{{ saving() ? 'Guardando...' : 'Aceptar y continuar' }}</app-button>
      }
    </app-surface-card>
  </main>` })
export class LegalConsentPageComponent {
  private readonly api = inject(LegalApiService); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute);
  readonly loading = signal(true); readonly saving = signal(false); readonly error = signal(''); readonly documents = signal<any[]>([]); readonly selected = signal(new Set<string>());
  constructor() { this.api.getConsentStatus().subscribe({ next: x => { this.documents.set(x.requiredDocuments); this.selected.set(new Set(x.acceptedDocumentIds)); this.loading.set(false); if (!x.isRequired) void this.continue(); }, error: () => { this.error.set('No se pudieron cargar las condiciones.'); this.loading.set(false); } }); }
  toggle(id: string): void { const next = new Set(this.selected()); next.has(id) ? next.delete(id) : next.add(id); this.selected.set(next); }
  async acceptAll(): Promise<void> { this.saving.set(true); const platform = await this.platform(); this.api.accept([...this.selected()], platform).subscribe({ next: () => void this.continue(), error: () => { this.error.set('No se pudo registrar tu aceptación.'); this.saving.set(false); } }); }
  private continue(): Promise<boolean> { return this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirectTo') || '/businesses'); }
  private async platform(): Promise<string> { try { return (await import('@capacitor/core')).Capacitor.getPlatform(); } catch { return 'web'; } }
}
