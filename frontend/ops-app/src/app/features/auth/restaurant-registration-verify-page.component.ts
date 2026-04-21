import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { getRegistrationState, setRegistrationState } from './registration-flow.storage';

@Component({
  selector: 'app-restaurant-registration-verify-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, AppNoticeComponent],
  template: `
    <section class="auth-page">
      <div class="page-card auth-card">
        <app-page-header
          eyebrow="Verificacion"
          title="Verificar correo"
          subtitle="Ingresa el codigo que AppuraPe envio al correo del restaurante."
        />

        <app-notice
          tone="info"
          title="Paso 2 de 3"
          message="Si no encuentras el codigo, revisa spam o usa Reenviar codigo. No puedes completar el registro sin verificar el correo."
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
            <label for="code">Codigo</label>
            <input id="code" type="text" formControlName="code" />
          </div>

          <div class="page-actions">
            <button class="button" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Verificando...' : 'Verificar codigo' }}
            </button>
            <button class="button secondary" type="button" (click)="resend()" [disabled]="isResending()">
              {{ isResending() ? 'Reenviando...' : 'Reenviar codigo' }}
            </button>
            <a class="button ghost" routerLink="/register/restaurant">Volver</a>
          </div>
        </form>
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
            this.errorMessage.set(response.message || 'No se pudo verificar el codigo.');
            this.isSubmitting.set(false);
            return;
          }

          setRegistrationState('restaurant', {
            email: response.email || raw.email.trim(),
            code: raw.code.trim(),
            started: true,
            verified: true,
          });
          this.successMessage.set(response.message || 'Codigo verificado correctamente.');
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/register/restaurant/complete');
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo verificar el codigo.'));
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
          this.successMessage.set(response.message || 'Te enviamos un nuevo codigo a tu correo.');
          this.isResending.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo reenviar el codigo.'));
          this.isResending.set(false);
        },
      });
  }
}
