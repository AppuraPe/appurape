import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LegalDocument } from '../../core/models/legal.models';
import { LegalApiService } from '../../core/services/legal-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({ selector: 'app-admin-legal-page', standalone: true, imports: [ReactiveFormsModule, AppButtonComponent, AppSurfaceCardComponent, PageHeaderComponent], template: `
  <section class="grid min-w-0 gap-4 pb-6"><app-page-header eyebrow="Administración" title="Documentos legales" subtitle="Prepara versiones nuevas y publica únicamente después de revisión legal." />
    <app-surface-card variant="page" extraClass="grid gap-4 p-4 sm:p-5"><h2 class="text-lg font-black">Nuevo borrador</h2>
      <form class="grid gap-3" [formGroup]="form" (ngSubmit)="create()"><div class="grid gap-3 sm:grid-cols-2"><label class="grid gap-1 text-sm font-bold">Tipo<input formControlName="type" /></label><label class="grid gap-1 text-sm font-bold">Audiencia<select formControlName="audience"><option>General</option><option>Customer</option><option>Restaurant</option><option>Driver</option><option>Collaborator</option></select></label><label class="grid gap-1 text-sm font-bold">Slug<input formControlName="slug" /></label><label class="grid gap-1 text-sm font-bold">Versión<input formControlName="version" /></label></div><label class="grid gap-1 text-sm font-bold">Título<input formControlName="title" /></label><label class="grid gap-1 text-sm font-bold">Contenido Markdown<textarea class="min-h-56" formControlName="contentMarkdown"></textarea></label><app-button type="submit" [disabled]="form.invalid || saving()">Guardar borrador</app-button></form>
    </app-surface-card>
    <div class="grid gap-3">@for (document of documents(); track document.id) { <app-surface-card variant="soft" extraClass="grid min-w-0 gap-3 p-4"><div class="flex min-w-0 flex-wrap items-start justify-between gap-2"><div class="min-w-0"><h3 class="break-words font-black">{{ document.title }}</h3><p class="text-xs text-slate-500">{{ document.audience }} · {{ document.version }} · {{ document.status }}</p></div>@if (document.status === 'Draft') { <app-button size="sm" (click)="publish(document.id)">Publicar</app-button> }</div><details><summary class="cursor-pointer text-sm font-bold text-primary-700">Previsualizar contenido</summary><pre class="mt-3 whitespace-pre-wrap break-words text-xs leading-6">{{ document.contentMarkdown }}</pre></details></app-surface-card> }</div>
  </section>` })
export class AdminLegalPageComponent {
  private readonly api = inject(LegalApiService); private readonly fb = inject(FormBuilder); private readonly notices = inject(NotificationService);
  readonly documents = signal<LegalDocument[]>([]); readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({ type: ['', Validators.required], audience: ['General', Validators.required], slug: ['', Validators.required], version: ['1.0', Validators.required], title: ['', Validators.required], contentMarkdown: ['', Validators.required] });
  constructor() { this.load(); }
  load(): void { this.api.getAllAdmin().subscribe(x => this.documents.set(x)); }
  create(): void { if (this.form.invalid) return; this.saving.set(true); this.api.createDraft(this.form.getRawValue()).subscribe({ next: () => { this.saving.set(false); this.form.reset({ audience: 'General', version: '1.0' }); this.load(); this.notices.success('Borrador creado.'); }, error: () => { this.saving.set(false); this.notices.error('No se pudo crear el borrador.'); } }); }
  publish(id: string): void { this.api.publish(id).subscribe({ next: () => { this.load(); this.notices.success('Documento publicado.'); }, error: (e) => this.notices.error(e?.error?.message || 'No se pudo publicar.') }); }
}
