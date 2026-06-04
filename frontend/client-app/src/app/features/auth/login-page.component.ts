import { Location } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly spotlightX = signal(50);
  readonly spotlightY = signal(40);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/restaurants');
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const x = Math.min(88, Math.max(12, (event.clientX / width) * 100));
    const y = Math.min(84, Math.max(16, (event.clientY / height) * 100));

    this.spotlightX.set(Number(x.toFixed(2)));
    this.spotlightY.set(Number(y.toFixed(2)));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warning('Completa email y contrasena para continuar.');
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.isSubmitting.set(false);

          if (user.role !== 'Customer') {
            this.authService.logout();
            this.notificationService.error('Esta app publica esta reservada para customers.');
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
          this.notificationService.error(getApiErrorMessage(error, 'Revisa tus credenciales e intenta nuevamente.'));
        },
      });
  }
}
