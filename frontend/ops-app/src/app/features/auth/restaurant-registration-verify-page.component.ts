import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { getRegistrationState, setRegistrationState } from './registration-flow.storage';

@Component({
  selector: 'app-restaurant-registration-verify-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppBackButtonComponent, PageHeaderComponent, AppNoticeComponent, AppButtonComponent, AppSurfaceCardComponent],
  template: `
    <section class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto grid w-full max-w-[860px] gap-3">
        <app-back-button fallbackUrl="/register/restaurant" label="Volver" />
      </div>
      <div class="mx-auto mt-3 grid w-full max-w-[860px] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <app-surface-card variant="soft" extraClass="hidden gap-4 p-4 sm:p-5 lg:grid">
          <div class="grid gap-2">
            <span class="inline-flex w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary-700">
              Paso 2 de 3
            </span>
            <h1 class="text-3xl font-black tracking-[-0.05em] sm:text-[2.1rem]">Verifica tu correo</h1>
            <p class="text-sm leading-6 text-text-muted">
              Ingresa el código enviado al correo del restaurante para poder crear la cuenta.
            </p>
          </div>

          <app-notice
            tone="info"
            title="Tip rápido"
            message="Si no ves el correo, revisa spam o usa reenviar. El flujo sigue sin salir de esta pantalla."
          />
        </app-surface-card>

        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <app-page-header
            eyebrow="Verificación"
            title="Verificar correo"
            subtitle="Código corto, acciones claras y sin botones peleando entre sí."
          />

          @if (errorMessage()) {
            <div class="message error">{{ errorMessage() }}</div>
          }

          @if (successMessage()) {
            <div class="message success">{{ successMessage() }}</div>
          }

          <form class="form-grid" [formGroup]="form" (ngSubmit)="verify()">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" readonly />
            </div>

            <div class="field">
              <label for="code">Código</label>
              <input id="code" type="text" formControlName="code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <app-button type="submit" [disabled]="isSubmitting()" size="lg" block>
                {{ isSubmitting() ? 'Verificando...' : 'Verificar código' }}
              </app-button>
              <app-button variant="secondary" type="button" (click)="resend()" [disabled]="isResending()" block>
                {{ isResending() ? 'Reenviando...' : 'Reenviar código' }}
              </app-button>
              <app-button variant="ghost" routerLink="/register/restaurant" block>Volver</app-button>
            </div>
          </form>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class RestaurantRegistrationVerifyPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly isResending = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]],
  });

  constructor() {
    const state = getRegistrationState('restaurant');
    if (!state?.started || !state.email) {
      void this.router.navigateByUrl('/register/restaurant');
      return;
    }

    this.form.patchValue({
      email: state.email,
      code: state.code,
    });
  }

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authApi
      .verifyRestaurantRegistrationCode({ email: raw.email.trim(), code: raw.code.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response.isVerified) {
            this.errorMessage.set(response.message || 'No se pudo verificar el código.');
            this.isSubmitting.set(false);
            return;
          }

          setRegistrationState('restaurant', {
            email: response.email || raw.email.trim(),
            code: raw.code.trim(),
            started: true,
            verified: true,
          });
          this.successMessage.set(response.message || 'Código verificado correctamente.');
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/register/restaurant/complete');
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo verificar el código.'));
          this.isSubmitting.set(false);
        },
      });
  }

  resend(): void {
    const email = this.form.controls.email.value.trim();
    if (!email) {
      return;
    }

    this.isResending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authApi
      .resendRestaurantRegistrationCode({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Te enviamos un nuevo código a tu correo.');
          this.isResending.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo reenviar el código.'));
          this.isResending.set(false);
        },
      });
  }
}
