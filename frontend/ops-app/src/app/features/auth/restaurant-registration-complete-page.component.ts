import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { clearRegistrationState, getRegistrationState } from './registration-flow.storage';

@Component({
  selector: 'app-restaurant-registration-complete-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, AppBackButtonComponent, PageHeaderComponent, AppNoticeComponent, AppButtonComponent, AppSurfaceCardComponent],
  template: `
    <section class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto grid w-full max-w-[860px] gap-3">
        <app-back-button fallbackUrl="/register/restaurant/verify" label="Volver" />
      </div>
      <div class="mx-auto mt-3 grid w-full max-w-[860px] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <app-surface-card variant="soft" extraClass="hidden gap-4 p-4 sm:p-5 lg:grid">
          <div class="grid gap-2">
            <span class="inline-flex w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary-700">
              Paso 3 de 3
            </span>
            <h1 class="text-3xl font-black tracking-[-0.05em] sm:text-[2.1rem]">Crea tu contraseña</h1>
            <p class="text-sm leading-6 text-text-muted">
              Último paso antes de entrar al panel. Mantuvimos la vista compacta para que el teclado no rompa el flujo.
            </p>
          </div>

          <app-notice
            tone="warning"
            title="Pendiente de aprobación"
            message="Podrás entrar al panel, pero el negocio se activa cuando un administrador apruebe la cuenta."
          />
        </app-surface-card>

        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <app-page-header
            eyebrow="Finalizar"
            title="Crear contraseña"
            subtitle="Completa el registro del negocio y entra al panel AppuraPe."
          />

          @if (errorMessage()) {
            <div class="message error">{{ errorMessage() }}</div>
          }

          @if (successMessage()) {
            <div class="message success">{{ successMessage() }}</div>
          }

          <form class="form-grid" [formGroup]="form" (ngSubmit)="complete()">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" readonly />
            </div>

            <div class="field">
              <label for="code">Código</label>
              <input id="code" type="text" formControlName="code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" class="min-h-0 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none focus:ring-0" />
                <button type="button" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-soft hover:text-primary-700" (click)="togglePasswordVisibility()" [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <lucide-angular class="h-4 w-4" [img]="showPassword() ? eyeOffIcon : eyeIcon" aria-hidden="true"></lucide-angular>
                </button>
              </div>
            </div>

            <div class="field">
              <label for="confirmPassword">Confirmar contraseña</label>
              <input id="confirmPassword" [type]="showPassword() ? 'text' : 'password'" formControlName="confirmPassword" />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <app-button type="submit" [disabled]="isSubmitting()" size="lg" block>
                {{ isSubmitting() ? 'Creando cuenta...' : 'Completar registro' }}
              </app-button>
              <app-button variant="ghost" routerLink="/register/restaurant/verify" block>Volver</app-button>
            </div>
          </form>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class RestaurantRegistrationCompletePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly showPassword = signal(false);
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    const state = getRegistrationState('restaurant');
    if (!state?.started || !state.email) {
      void this.router.navigateByUrl('/register/restaurant');
      return;
    }

    if (!state.verified) {
      void this.router.navigateByUrl('/register/restaurant/verify');
      return;
    }

    this.form.patchValue({
      email: state.email,
      code: state.code,
    });
  }

  complete(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .completeRestaurantRegistration({
        email: raw.email.trim(),
        code: raw.code.trim(),
        password: raw.password,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          clearRegistrationState('restaurant');
          this.successMessage.set(
            'Tu cuenta fue creada y quedó pendiente de aprobación. Ya puedes entrar, pero operarás cuando un administrador apruebe tu cuenta.',
          );
          this.isSubmitting.set(false);
          setTimeout(() => void this.router.navigateByUrl('/business/dashboard'), 1500);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo completar el registro del negocio.'));
          this.isSubmitting.set(false);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
