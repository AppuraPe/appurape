import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  template: `
    <section class="page-shell">
      <div class="split" style="align-items: stretch;">
        <div class="hero-card">
          <app-page-header
            eyebrow="AppuraPe"
            title="Entra y continua tu pedido"
            subtitle="Inicia sesion para crear pedidos, revisar tu historial y seguir el estado de entrega."
          />
          <div class="hero-actions">
            <span class="badge success">Pedidos protegidos</span>
            <span class="badge">Registro con correo</span>
          </div>
        </div>

        <div class="app-card elevated">
          <app-page-header
            eyebrow="Acceso"
            title="Iniciar sesion"
            subtitle="Usa el correo y contrasena de tu cuenta customer."
          />

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="cliente@appurape.pe" />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <span class="field-error">Ingresa un email valido para continuar.</span>
              }
            </div>

            <div class="field">
              <label for="password">Contrasena</label>
              <input id="password" type="password" formControlName="password" placeholder="Tu contrasena" />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <span class="field-error">La contrasena es obligatoria.</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert error">
                <strong class="alert-title">No pudimos iniciar sesion</strong>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button class="button full primary-action" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Ingresando...' : 'Ingresar a AppuraPe' }}
            </button>

            <div class="alert info">
              <strong class="alert-title">Aun no tienes cuenta?</strong>
              <span>Crea una cuenta customer y verifica tu correo en pocos pasos.</span>
              <a class="button ghost" routerLink="/register" style="margin-top: 0.75rem;">Crear cuenta</a>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.isSubmitting.set(false);

          if (user.role !== 'Customer') {
            this.authService.logout();
            this.errorMessage.set('Esta app publica esta reservada para customers.');
            return;
          }

          const redirectTo =
            this.route.snapshot.queryParamMap.get('returnUrl') ||
            this.route.snapshot.queryParamMap.get('redirectTo') ||
            '/restaurants';
          void this.router.navigateByUrl(redirectTo);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(getApiErrorMessage(error, 'Revisa tus credenciales e intenta nuevamente.'));
        },
      });
  }
}
