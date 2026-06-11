import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArrowRight, Eye, EyeOff, LockKeyhole, LucideAngularModule, Mail, ShieldCheck, Store, Truck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { GoogleSignInService } from '../../core/services/google-sign-in.service';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AppBackButtonComponent,
    PageHeaderComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto grid w-full max-w-[960px] gap-3">
        <app-back-button fallbackUrl="/businesses" label="Volver a negocios" />
      </div>
      <div class="mx-auto mt-3 grid w-full max-w-[960px] gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <app-surface-card variant="soft" extraClass="hidden gap-4 p-4 sm:p-5 lg:grid">
          <div class="grid gap-2">
            <span class="inline-flex w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary-700">
              AppuraPe
            </span>
            <h1 class="text-3xl font-black tracking-[-0.05em] sm:text-[2.25rem]">Tu acceso diario</h1>
            <p class="max-w-md text-sm leading-6 text-text-muted">
              Entra rápido para pedir, repartir o gestionar tu negocio sin pantallas pesadas.
            </p>
          </div>

          <div class="grid gap-2 sm:grid-cols-3">
            <article class="min-w-0 rounded-[20px] border border-[#eddad4] bg-white px-4 py-3">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="storeIcon" aria-hidden="true"></lucide-angular>
              <p class="mt-2 text-xs font-black uppercase tracking-[0.14em] text-loreto-carbon">Pide</p>
            </article>
            <article class="min-w-0 rounded-[20px] border border-[#eddad4] bg-white px-4 py-3">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="truckIcon" aria-hidden="true"></lucide-angular>
              <p class="mt-2 text-xs font-black uppercase tracking-[0.14em] text-loreto-carbon">Reparte</p>
            </article>
            <article class="min-w-0 rounded-[20px] border border-[#eddad4] bg-white px-4 py-3">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="shieldIcon" aria-hidden="true"></lucide-angular>
              <p class="mt-2 text-xs font-black uppercase tracking-[0.14em] text-loreto-carbon">Gestiona</p>
            </article>
          </div>
        </app-surface-card>

        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <div class="grid gap-5">
            <app-page-header eyebrow="Login" title="Iniciar sesión" subtitle="Usa tu correo y continúa donde te quedaste." />

            <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
              <label class="grid gap-2">
                <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Email</span>
                <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                  <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="mailIcon" aria-hidden="true"></lucide-angular>
                  <input id="email" type="email" formControlName="email" placeholder="tu@correo.com" class="min-h-0 min-w-0 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0" />
                </div>
              </label>

              <label class="grid gap-2">
                <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Contraseña</span>
                <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ddc8c1] bg-white px-4 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                  <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="lockIcon" aria-hidden="true"></lucide-angular>
                  <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="Tu contraseña" class="min-h-0 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none placeholder:text-text-muted/70 focus:ring-0" />
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

              @if (errorMessage()) {
                <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {{ errorMessage() }}
                </div>
              }

              <app-button type="submit" [disabled]="isSubmitting()" block size="lg">
                {{ isSubmitting() ? 'Ingresando...' : 'Ingresar' }}
                <lucide-angular class="h-4 w-4" [img]="arrowRightIcon" aria-hidden="true"></lucide-angular>
              </app-button>

              <a routerLink="/forgot-password" class="text-center text-sm font-semibold text-primary-700 transition hover:text-primary-600">
                Olvidé mi contraseña
              </a>

              <div class="grid gap-3 rounded-[20px] border border-[#eddad4] bg-white p-4">
                <div class="flex items-center gap-3">
                  <span class="h-px flex-1 bg-[#eddad4]"></span>
                  <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-text-muted">o sigue rápido</span>
                  <span class="h-px flex-1 bg-[#eddad4]"></span>
                </div>

                @if (isGoogleConfigured()) {
                  <div class="grid gap-2">
                    @if (isNativeGoogleFlow()) {
                      <app-button type="button" variant="secondary" size="lg" block [disabled]="isGoogleSubmitting()" (click)="submitNativeGoogleLogin()">
                        {{ isGoogleSubmitting() ? 'Conectando con Google...' : 'Continuar con Google' }}
                      </app-button>
                      <p class="text-center text-xs leading-5 text-text-muted">
                        Abre el selector nativo de Google dentro de la app.
                      </p>
                    } @else {
                      <div #googleButtonContainer class="min-h-11"></div>
                    }

                    @if (isGoogleSubmitting()) {
                      <p class="text-center text-xs font-semibold text-text-muted">Conectando con Google...</p>
                    }
                  </div>
                } @else {
                  <p class="text-center text-xs leading-5 text-text-muted">
                    Configura los Client IDs de Google para habilitar el acceso rápido con Gmail.
                  </p>
                }

                @if (googleErrorMessage()) {
                  <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {{ googleErrorMessage() }}
                  </div>
                }
              </div>

              <div class="grid gap-3 rounded-[20px] border border-[#eddad4] bg-surface-soft p-4">
                <span class="text-sm font-black text-loreto-carbon">Crear cuenta</span>
                <div class="flex flex-wrap gap-2 text-sm font-semibold text-primary-700">
                  <a class="rounded-full border border-[#eddad4] bg-white px-3 py-2 transition hover:border-primary-200 hover:text-primary-600" routerLink="/register">Cliente</a>
                  <a class="rounded-full border border-[#eddad4] bg-white px-3 py-2 transition hover:border-primary-200 hover:text-primary-600" routerLink="/register/restaurant">Negocio</a>
                  <a class="rounded-full border border-[#eddad4] bg-white px-3 py-2 transition hover:border-primary-200 hover:text-primary-600" routerLink="/register/driver">Driver</a>
                </div>
              </div>
            </form>
          </div>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class LoginPageComponent implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleSignInService = inject(GoogleSignInService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('googleButtonContainer')
  private googleButtonContainer?: ElementRef<HTMLElement>;

  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);
  readonly googleErrorMessage = signal('');
  readonly isGoogleSubmitting = signal(false);
  readonly isGoogleConfigured = signal(this.googleSignInService.isConfigured());
  readonly isNativeGoogleFlow = signal(this.googleSignInService.isNativePlatform());
  readonly showPassword = signal(false);

  readonly mailIcon = Mail;
  readonly lockIcon = LockKeyhole;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;
  readonly arrowRightIcon = ArrowRight;
  readonly storeIcon = Store;
  readonly truckIcon = Truck;
  readonly shieldIcon = ShieldCheck;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    if (this.authService.hasValidSession()) {
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
    }
  }

  ngAfterViewInit(): void {
    void this.setupGoogleButton();
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
          const redirectTo =
            this.route.snapshot.queryParamMap.get('redirectTo') ||
            this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(redirectTo || this.authService.getDefaultRoute(user.role));
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(error?.error?.message || 'No se pudo iniciar sesión.');
        },
      });
  }

  async submitNativeGoogleLogin(): Promise<void> {
    this.errorMessage.set('');
    this.googleErrorMessage.set('');
    this.isGoogleSubmitting.set(true);

    try {
      const idToken = await this.googleSignInService.signInNative();
      this.submitGoogleCredential(idToken);
    } catch (error) {
      this.isGoogleSubmitting.set(false);

      const errorCode =
        typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';

      if (errorCode === 'USER_CANCELLED') {
        return;
      }

      this.googleErrorMessage.set(error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  private async setupGoogleButton(): Promise<void> {
    const container = this.googleButtonContainer?.nativeElement;

    if (!container || !this.isGoogleConfigured() || this.isNativeGoogleFlow()) {
      return;
    }

    try {
      await this.googleSignInService.renderWebButton(container, (credential) => {
        this.submitGoogleCredential(credential);
      });
    } catch (error) {
      this.googleErrorMessage.set(error instanceof Error ? error.message : 'No se pudo cargar el acceso con Google.');
    }
  }

  private submitGoogleCredential(idToken: string): void {
    this.errorMessage.set('');
    this.googleErrorMessage.set('');
    this.isGoogleSubmitting.set(true);

    this.authService
      .loginWithGoogle({ idToken })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.isGoogleSubmitting.set(false);
          const redirectTo =
            this.route.snapshot.queryParamMap.get('redirectTo') ||
            this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(redirectTo || this.authService.getDefaultRoute(user.role));
        },
        error: (error) => {
          this.isGoogleSubmitting.set(false);
          this.googleErrorMessage.set(error?.error?.message || 'No se pudo iniciar sesión con Google.');
        },
      });
  }
}
