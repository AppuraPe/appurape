import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, AppNoticeComponent],
  template: `
    <section class="auth-page">
      <div class="page-card auth-card">
        <app-page-header
          eyebrow="AppuraPe"
          title="Panel operativo"
          subtitle="Accede como restaurante, driver o administrador."
        />

        <app-notice
          tone="info"
          title="Acceso operativo"
          message="Este panel es exclusivo para Admin, Restaurant y Driver. Las cuentas Customer se usan desde client-app."
        />

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" />
          </div>

          <div class="field">
            <label for="password">Contrasena</label>
            <input id="password" type="password" formControlName="password" />
          </div>

          @if (errorMessage()) {
            <div class="message error">{{ errorMessage() }}</div>
          }

          <div class="button-row">
            <button class="button" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Ingresando...' : 'Ingresar al panel' }}
            </button>
          </div>

          <div class="auth-links">
            <span class="muted">Quieres operar en AppuraPe?</span>
            <a routerLink="/register/restaurant">Registrar restaurante</a>
            <a routerLink="/register/driver">Registrar driver</a>
          </div>
        </form>
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

  constructor() {
    if (this.authService.hasValidOpsSession()) {
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
    }
  }

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

          if (!this.authService.isOpsRole(user.role)) {
            this.authService.logout();
            this.errorMessage.set('Esta aplicacion no permite cuentas Customer.');
            return;
          }

          const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
          void this.router.navigateByUrl(redirectTo || this.authService.getDefaultRoute(user.role));
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(error?.error?.message || 'No se pudo iniciar sesion.');
        },
      });
  }
}
