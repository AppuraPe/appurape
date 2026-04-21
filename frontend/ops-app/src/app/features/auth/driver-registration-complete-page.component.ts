import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { clearRegistrationState, getRegistrationState } from './registration-flow.storage';

@Component({
  selector: 'app-driver-registration-complete-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, AppNoticeComponent],
  template: `
    <section class="auth-page">
      <div class="page-card auth-card">
        <app-page-header
          eyebrow="Finalizar"
          title="Crear password"
          subtitle="Completa el registro del driver y entra al panel AppuraPe."
        />

        <app-notice
          tone="warning"
          title="Paso 3 de 3"
          message="Al crear la cuenta entraras al panel, pero quedaras pendiente de aprobacion antes de poder tomar pedidos."
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
            <label for="code">Codigo</label>
            <input id="code" type="text" formControlName="code" />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" />
          </div>

          <div class="field">
            <label for="confirmPassword">Confirmar password</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword" />
          </div>

          <div class="page-actions">
            <button class="button" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Creando cuenta...' : 'Completar registro' }}
            </button>
            <a class="button ghost" routerLink="/register/driver/verify">Volver</a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class DriverRegistrationCompletePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    const state = getRegistrationState('driver');
    if (!state?.started || !state.email) {
      void this.router.navigateByUrl('/register/driver');
      return;
    }

    if (!state.verified) {
      void this.router.navigateByUrl('/register/driver/verify');
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
      this.errorMessage.set('Los passwords no coinciden.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .completeDriverRegistration({
        email: raw.email.trim(),
        code: raw.code.trim(),
        password: raw.password,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          clearRegistrationState('driver');
          this.successMessage.set(
            'Tu cuenta fue creada y quedo pendiente de aprobacion. Ya puedes entrar, pero podras operar cuando un administrador apruebe tu cuenta.',
          );
          this.isSubmitting.set(false);
          setTimeout(() => void this.router.navigateByUrl('/driver/dashboard'), 1500);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo completar el registro del driver.'));
          this.isSubmitting.set(false);
        },
      });
  }
}
