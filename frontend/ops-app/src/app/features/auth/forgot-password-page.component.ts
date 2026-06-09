import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, LucideAngularModule, Mail } from 'lucide-angular';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AppBackButtonComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
    PageHeaderComponent,
  ],
  template: `
    <section class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto grid w-full max-w-[720px] gap-3">
        <app-back-button fallbackUrl="/login" label="Volver al login" />
      </div>

      <div class="mx-auto mt-3 grid w-full max-w-[720px] gap-4">
        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <div class="grid gap-5">
            <app-page-header
              eyebrow="Recuperar acceso"
              title="Recuperar contraseña"
              subtitle="Te enviamos un código por correo para definir una nueva contraseña."
            />

            <form class="grid gap-4" [formGroup]="requestForm" (ngSubmit)="submitRequest()">
              <label class="grid gap-2">
                <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Email</span>
                <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                  <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="mailIcon" aria-hidden="true"></lucide-angular>
                  <input formControlName="email" type="email" placeholder="tu@correo.com" class="min-h-0 min-w-0 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0" />
                </div>
              </label>

              @if (requestMessage()) {
                <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-loreto-carbon">
                  {{ requestMessage() }}
                </div>
              }

              @if (requestError()) {
                <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {{ requestError() }}
                </div>
              }

              <app-button type="submit" [disabled]="isRequestSubmitting()" block size="lg">
                {{ isRequestSubmitting() ? 'Enviando...' : 'Enviar código' }}
                <lucide-angular class="h-4 w-4" [img]="arrowRightIcon" aria-hidden="true"></lucide-angular>
              </app-button>
            </form>

            <div class="h-px bg-[#eddad4]"></div>

            <form class="grid gap-4" [formGroup]="resetForm" (ngSubmit)="submitReset()">
              <div class="grid gap-1">
                <h2 class="text-base font-black text-loreto-carbon">Ingresar código y nueva contraseña</h2>
                <p class="text-sm leading-6 text-text-muted">
                  Usa el código de 6 dígitos que llegó a tu correo.
                </p>
              </div>

              <label class="grid gap-2">
                <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Email</span>
                <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                  <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="mailIcon" aria-hidden="true"></lucide-angular>
                  <input formControlName="email" type="email" placeholder="tu@correo.com" class="min-h-0 min-w-0 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0" />
                </div>
              </label>

              <label class="grid gap-2">
                <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Código</span>
                <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                  <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="keyIcon" aria-hidden="true"></lucide-angular>
                  <input formControlName="code" inputmode="numeric" maxlength="6" placeholder="123456" class="min-h-0 min-w-0 border-0 bg-transparent px-0 py-0 text-sm tracking-[0.24em] text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0" />
                </div>
              </label>

              <label class="grid gap-2">
                <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Nueva contraseña</span>
                <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                  <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="lockIcon" aria-hidden="true"></lucide-angular>
                  <input
                    formControlName="newPassword"
                    [type]="showPassword() ? 'text' : 'password'"
                    placeholder="Mínimo 6 caracteres"
                    class="min-h-0 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0"
                  />
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-soft hover:text-primary-700"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <lucide-angular class="h-4 w-4" [img]="showPassword() ? eyeOffIcon : eyeIcon" aria-hidden="true"></lucide-angular>
                  </button>
                </div>
              </label>

              @if (resetMessage()) {
                <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {{ resetMessage() }}
                </div>
              }

              @if (resetError()) {
                <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {{ resetError() }}
                </div>
              }

              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <app-button type="submit" [disabled]="isResetSubmitting()" block size="lg">
                  {{ isResetSubmitting() ? 'Actualizando...' : 'Actualizar contraseña' }}
                </app-button>
                <app-button type="button" variant="ghost" size="lg" [disabled]="isRequestSubmitting()" (click)="resendCode()">
                  Reenviar código
                </app-button>
              </div>

              <a routerLink="/login" class="text-center text-sm font-semibold text-primary-700 transition hover:text-primary-600">
                Volver a iniciar sesión
              </a>
            </form>
          </div>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class ForgotPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isRequestSubmitting = signal(false);
  readonly isResetSubmitting = signal(false);
  readonly requestMessage = signal('');
  readonly requestError = signal('');
  readonly resetMessage = signal('');
  readonly resetError = signal('');
  readonly showPassword = signal(false);

  readonly mailIcon = Mail;
  readonly keyIcon = KeyRound;
  readonly lockIcon = LockKeyhole;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;
  readonly arrowRightIcon = ArrowRight;

  readonly requestForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.requestError.set('');
    this.requestMessage.set('');
    this.isRequestSubmitting.set(true);

    const { email } = this.requestForm.getRawValue();

    this.authApi
      .startPasswordReset({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isRequestSubmitting.set(false);
          this.requestMessage.set('Revisa tu correo. Si la cuenta existe, enviamos un código.');
          this.resetForm.patchValue({ email: response.email || email });
        },
        error: (error) => {
          this.isRequestSubmitting.set(false);
          this.requestError.set(error?.error?.message || 'No se pudo enviar el código.');
        },
      });
  }

  resendCode(): void {
    const email = this.resetForm.getRawValue().email || this.requestForm.getRawValue().email;

    if (!email) {
      this.requestError.set('Primero ingresa tu correo para enviar el código.');
      return;
    }

    this.requestError.set('');
    this.requestMessage.set('');
    this.isRequestSubmitting.set(true);

    this.authApi
      .resendPasswordResetCode({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isRequestSubmitting.set(false);
          this.requestMessage.set('Listo. Si la cuenta existe, reenviamos un nuevo código.');
        },
        error: (error) => {
          this.isRequestSubmitting.set(false);
          this.requestError.set(error?.error?.message || 'No se pudo reenviar el código.');
        },
      });
  }

  submitReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.resetError.set('');
    this.resetMessage.set('');
    this.isResetSubmitting.set(true);

    const { email, code, newPassword } = this.resetForm.getRawValue();

    this.authApi
      .resetPassword({ email, code, newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isResetSubmitting.set(false);
          this.resetMessage.set('Tu contraseña ya fue actualizada. Ahora puedes iniciar sesión.');
          setTimeout(() => void this.router.navigateByUrl('/login'), 900);
        },
        error: (error) => {
          this.isResetSubmitting.set(false);
          this.resetError.set(error?.error?.message || 'No se pudo actualizar la contraseña.');
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
