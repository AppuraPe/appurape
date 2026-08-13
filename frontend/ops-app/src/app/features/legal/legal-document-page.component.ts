import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LegalDocument } from '../../core/models/legal.models';
import { LegalApiService } from '../../core/services/legal-api.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({ selector: 'app-legal-document-page', standalone: true, imports: [RouterLink, AppButtonComponent, AppSurfaceCardComponent], template: `
  <main class="mx-auto grid min-h-dvh w-full max-w-3xl gap-4 overflow-x-hidden px-4 py-6 sm:px-6">
    <app-surface-card variant="page" extraClass="grid min-w-0 gap-4 p-5 sm:p-7">
      @if (document(); as item) {
        <div><p class="text-xs font-black uppercase tracking-widest text-primary-700">Documento legal · {{ item.version }}</p><h1 class="mt-2 break-words text-2xl font-black text-slate-950">{{ item.title }}</h1></div>
        <article class="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{{ item.contentMarkdown }}</article>
      } @else if (error()) { <p class="text-sm text-red-700">{{ error() }}</p> } @else { <p class="text-sm text-slate-500">Cargando documento...</p> }
      <app-button variant="secondary" routerLink="/businesses">Volver a AppuraPe</app-button>
    </app-surface-card>
  </main>` })
export class LegalDocumentPageComponent {
  private readonly route = inject(ActivatedRoute); private readonly api = inject(LegalApiService);
  readonly document = signal<LegalDocument | null>(null); readonly error = signal('');
  constructor() { const slug = (this.route.snapshot.data['slug'] as string | undefined) || this.route.snapshot.paramMap.get('slug') || ''; this.api.getDocument(slug).subscribe({ next: x => this.document.set(x), error: () => this.error.set('Este documento todavía no está publicado.') }); }
}
