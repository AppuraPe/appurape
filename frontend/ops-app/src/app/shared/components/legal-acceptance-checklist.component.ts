import { Component, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalDocument } from '../../core/models/legal.models';
import { LegalApiService } from '../../core/services/legal-api.service';

@Component({ selector: 'app-legal-acceptance-checklist', standalone: true, imports: [RouterLink], template: `
  <section class="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"><strong class="text-sm">Documentos legales</strong>
    @if (loading()) { <span class="text-xs text-slate-500">Cargando condiciones...</span> }
    @for (document of documents(); track document.id) { <label class="flex min-w-0 items-start gap-3 rounded-xl bg-white p-3"><input class="mt-0.5 h-5 w-5 shrink-0" type="checkbox" [checked]="selected().has(document.id)" (change)="toggle(document.id)" /><span class="min-w-0 text-xs leading-5 text-slate-600">Acepto <strong>{{ document.title }}</strong> ({{ document.version }}). <a class="font-bold text-primary-700" [routerLink]="'/legal/document/' + document.slug" target="_blank">Leer</a></span></label> }
  </section>` })
export class LegalAcceptanceChecklistComponent {
  private readonly api = inject(LegalApiService); readonly role = input.required<string>(); readonly selectionChange = output<string[]>(); readonly readyChange = output<boolean>();
  readonly documents = signal<LegalDocument[]>([]); readonly selected = signal(new Set<string>()); readonly loading = signal(true);
  constructor() { effect(() => { const role = this.role(); this.loading.set(true); this.api.getActive(role).subscribe({ next: docs => { this.documents.set(docs); this.loading.set(false); this.emit(); }, error: () => { this.documents.set([]); this.loading.set(false); this.readyChange.emit(false); } }); }); }
  toggle(id: string): void { const next = new Set(this.selected()); next.has(id) ? next.delete(id) : next.add(id); this.selected.set(next); this.emit(); }
  private emit(): void { this.selectionChange.emit([...this.selected()]); this.readyChange.emit(!this.loading() && this.selected().size === this.documents().length); }
}
