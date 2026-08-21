import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LucideAngularModule, Mail, ShieldCheck, UserPlus } from 'lucide-angular';
import {
  CompleteCustomerRegistrationRequest,
  ResendCustomerRegistrationCodeRequest,
  StartCustomerRegistrationRequest,
  VerifyCustomerRegistrationCodeRequest,
} from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { LegalAcceptanceChecklistComponent } from '../../shared/components/legal-acceptance-checklist.component';

type RegisterStep = 'start' | 'verify' | 'complete';

type RegisterFlowState = {
  step: RegisterStep;
  firstName: string;
  lastName: string;
  phone: string;
  identityDocumentNumber: string;
  email: string;
  code: string;
  isCodeVerified: boolean;
  expiresInMinutes: number | null;
};

const REGISTER_FLOW_STORAGE_KEY = 'iquitosDelivery.app.register-flow';

function confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, AppBackButtonComponent, PageHeaderComponent, AppButtonComponent, AppSurfaceCardComponent, LegalAcceptanceChecklistComponent],
  template: `
    <section class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto grid w-full max-w-[980px] gap-3">
        <app-back-button fallbackUrl="/businesses" label="Volver a negocios" />
      </div>
      <div class="mx-auto mt-3 grid w-full max-w-[980px] gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <app-surface-card variant="soft" extraClass="hidden gap-4 p-4 sm:p-5 lg:grid">
          <div class="grid gap-2">
            <span class="inline-flex w-fit items-center rounded-full bg-primary-100 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary-700">
              Registro
            </span>
            <h1 class="text-3xl font-black tracking-[-0.05em] sm:text-[2.25rem]">Tu cuenta en tres pasos</h1>
            <p class="max-w-md text-sm leading-6 text-text-muted">
              Primero tus datos, luego el código y al final tu clave. Todo en una sola secuencia clara.
            </p>
          </div>

          <div class="grid gap-2">
            <article class="flex min-w-0 items-center gap-3 rounded-[20px] border px-4 py-3 transition" [class]="currentStep() === 'start' ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-200 bg-white text-slate-950'">
              <lucide-angular class="h-4 w-4 shrink-0" [class]="currentStep() === 'start' ? 'text-white' : 'text-primary-700'" [img]="userPlusIcon" aria-hidden="true"></lucide-angular>
              <div class="min-w-0">
                <p class="text-[0.68rem] font-black uppercase tracking-[0.16em] opacity-80">Paso 1</p>
                <p class="truncate text-sm font-semibold">Tus datos básicos</p>
              </div>
            </article>
            <article class="flex min-w-0 items-center gap-3 rounded-[20px] border px-4 py-3 transition" [class]="currentStep() === 'verify' ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-200 bg-white text-slate-950'">
              <lucide-angular class="h-4 w-4 shrink-0" [class]="currentStep() === 'verify' ? 'text-white' : 'text-primary-700'" [img]="mailIcon" aria-hidden="true"></lucide-angular>
              <div class="min-w-0">
                <p class="text-[0.68rem] font-black uppercase tracking-[0.16em] opacity-80">Paso 2</p>
                <p class="truncate text-sm font-semibold">Verifica tu correo</p>
              </div>
            </article>
            <article class="flex min-w-0 items-center gap-3 rounded-[20px] border px-4 py-3 transition" [class]="currentStep() === 'complete' ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-200 bg-white text-slate-950'">
              <lucide-angular class="h-4 w-4 shrink-0" [class]="currentStep() === 'complete' ? 'text-white' : 'text-primary-700'" [img]="shieldIcon" aria-hidden="true"></lucide-angular>
              <div class="min-w-0">
                <p class="text-[0.68rem] font-black uppercase tracking-[0.16em] opacity-80">Paso 3</p>
                <p class="truncate text-sm font-semibold">Crea tu clave</p>
              </div>
            </article>
          </div>
        </app-surface-card>

        <app-surface-card variant="page" extraClass="w-full p-5 sm:p-6">
          <div class="grid gap-5">
            <app-page-header eyebrow="Registro" title="Crear cuenta" subtitle="Una experiencia corta, móvil y sin pasos sobrantes." />

            <section class="grid gap-2.5 rounded-[16px] border border-slate-200 bg-slate-50 p-3" aria-labelledby="account-type-title">
              <div class="min-w-0">
                <p id="account-type-title" class="text-sm font-black text-slate-950">Tipo de cuenta</p>
                <p class="mt-0.5 text-xs leading-5 text-slate-500">Elige cómo usarás AppuraPe.</p>
              </div>
              <div class="mobile-choice-group">
                <a class="mobile-choice-item !border-primary-700 !bg-primary-50 !text-primary-700" routerLink="/register" aria-current="page"><span class="min-w-0 truncate">Cliente</span></a>
                <a class="mobile-choice-item" routerLink="/register/restaurant"><span class="min-w-0 truncate">Negocio</span></a>
                <a class="mobile-choice-item" routerLink="/register/driver"><span class="min-w-0 truncate">Repartidor</span></a>
              </div>
            </section>

            <div class="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
              <span class="inline-flex min-w-0 items-center justify-center rounded-full border px-2.5 py-1.5 text-center text-[0.64rem] font-black uppercase tracking-[0.14em] transition sm:min-w-fit sm:px-3 sm:text-[0.68rem] sm:tracking-[0.18em]" [class]="currentStep() === 'start' ? 'border-primary-700 bg-primary-700 text-white' : 'border-primary-100 bg-white text-primary-700'">1. Datos</span>
              <span class="hidden h-px min-w-4 flex-1 bg-primary-100 sm:block"></span>
              <span class="inline-flex min-w-0 items-center justify-center rounded-full border px-2.5 py-1.5 text-center text-[0.64rem] font-black uppercase tracking-[0.14em] transition sm:min-w-fit sm:px-3 sm:text-[0.68rem] sm:tracking-[0.18em]" [class]="currentStep() === 'verify' ? 'border-primary-700 bg-primary-700 text-white' : 'border-primary-100 bg-white text-primary-700'">2. Código</span>
              <span class="hidden h-px min-w-4 flex-1 bg-primary-100 sm:block"></span>
              <span class="inline-flex min-w-0 items-center justify-center rounded-full border px-2.5 py-1.5 text-center text-[0.64rem] font-black uppercase tracking-[0.14em] transition sm:min-w-fit sm:px-3 sm:text-[0.68rem] sm:tracking-[0.18em]" [class]="currentStep() === 'complete' ? 'border-primary-700 bg-primary-700 text-white' : 'border-primary-100 bg-white text-primary-700'">3. Clave</span>
            </div>

            @if (currentStep() === 'start') {
              <form class="grid gap-4" [formGroup]="startForm" (ngSubmit)="submitStart()">
                <div class="grid gap-4 md:grid-cols-2">
                  <label class="grid gap-2">
                    <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Nombres</span>
                    <input id="firstName" type="text" formControlName="firstName" />
                  </label>
                  <label class="grid gap-2">
                    <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Apellidos</span>
                    <input id="lastName" type="text" formControlName="lastName" />
                  </label>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <label class="grid gap-2">
                    <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Teléfono</span>
                    <input id="phone" type="tel" formControlName="phone" inputmode="tel" placeholder="999999999" />
                    @if (startForm.controls.phone.invalid && startForm.controls.phone.touched) {
                      <span class="text-xs font-semibold text-red-600">Ingresa un celular peruano válido de 9 dígitos.</span>
                    }
                  </label>
                  <label class="grid gap-2">
                    <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">DNI</span>
                    <input id="identityDocumentNumber" type="text" formControlName="identityDocumentNumber" inputmode="numeric" maxlength="8" placeholder="12345678" />
                    @if (startForm.controls.identityDocumentNumber.invalid && startForm.controls.identityDocumentNumber.touched) {
                      <span class="text-xs font-semibold text-red-600">Ingresa tu DNI de 8 dígitos.</span>
                    }
                  </label>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <label class="grid gap-2 md:col-span-2">
                    <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Email</span>
                    <input id="email" type="email" formControlName="email" />
                  </label>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <app-button type="submit" [disabled]="isSubmittingStart()" size="lg" block>
                    {{ isSubmittingStart() ? 'Enviando...' : 'Enviar código' }}
                    <lucide-angular class="h-4 w-4" [img]="arrowRightIcon" aria-hidden="true"></lucide-angular>
                  </app-button>
                  <app-button variant="ghost" [routerLink]="'/login'" block>Ingresar</app-button>
                </div>
              </form>
            }

            @if (currentStep() === 'verify') {
              <form class="grid gap-4" [formGroup]="verifyForm" (ngSubmit)="submitVerify()">
                <label class="grid gap-2">
                  <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Email</span>
                  <input id="verifyEmail" type="email" formControlName="email" readonly />
                </label>

                <label class="grid gap-2">
                  <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Código</span>
                  <input id="code" type="text" formControlName="code" placeholder="123456" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
                </label>

                @if (expiresInMinutes()) {
                  <div class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
                    Tu código vence en {{ expiresInMinutes() }} min.
                  </div>
                }

                <div class="grid gap-3 sm:grid-cols-3">
                  <app-button type="submit" [disabled]="isSubmittingVerify()" size="lg" block>
                    {{ isSubmittingVerify() ? 'Verificando...' : 'Verificar' }}
                  </app-button>
                  <app-button variant="ghost" type="button" (click)="resendCode()" [disabled]="isResendingCode()" block>
                    {{ isResendingCode() ? 'Reenviando...' : 'Reenviar' }}
                  </app-button>
                  <app-button variant="secondary" type="button" (click)="goToStart()" block>Editar</app-button>
                </div>
              </form>
            }

            @if (currentStep() === 'complete') {
              <form class="grid gap-4" [formGroup]="completeForm" (ngSubmit)="submitComplete()">
                <label class="grid gap-2">
                  <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Email</span>
                  <input id="completeEmail" type="email" formControlName="email" readonly />
                </label>

                <label class="grid gap-2">
                  <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Clave</span>
                  <div class="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/15">
                    <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" class="min-h-0 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-loreto-carbon shadow-none focus:ring-0" />
                    <button type="button" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-soft hover:text-primary-700" (click)="togglePasswordVisibility()" [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                      <lucide-angular class="h-4 w-4" [img]="showPassword() ? eyeOffIcon : eyeIcon" aria-hidden="true"></lucide-angular>
                    </button>
                  </div>
                </label>

                <label class="grid gap-2">
                  <span class="text-[0.72rem] font-black uppercase tracking-[0.16em] text-text-muted">Confirmar</span>
                  <input id="confirmPassword" [type]="showPassword() ? 'text' : 'password'" formControlName="confirmPassword" />
                </label>

                <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  <lucide-angular class="mr-2 inline h-4 w-4" [img]="checkIcon" aria-hidden="true"></lucide-angular>
                  Código verificado
                </div>

                <app-legal-acceptance-checklist role="Customer" (selectionChange)="acceptedLegalDocumentIds.set($event)" (readyChange)="legalReady.set($event)" />

                <div class="grid gap-3 sm:grid-cols-3">
                  <app-button type="submit" [disabled]="isSubmittingComplete() || !legalReady()" size="lg" block>
                    {{ isSubmittingComplete() ? 'Creando...' : 'Completar' }}
                  </app-button>
                  <app-button variant="ghost" type="button" (click)="goToVerify()" block>Volver</app-button>
                  <app-button variant="secondary" [routerLink]="'/login'" block>Login</app-button>
                </div>
              </form>
            }
          </div>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentStep = signal<RegisterStep>('start');
  readonly expiresInMinutes = signal<number | null>(null);
  readonly isSubmittingStart = signal(false);
  readonly isSubmittingVerify = signal(false);
  readonly isResendingCode = signal(false);
  readonly isSubmittingComplete = signal(false);
  readonly verifiedCode = signal('');
  readonly showPassword = signal(false);
  readonly acceptedLegalDocumentIds = signal<string[]>([]);
  readonly legalReady = signal(false);

  readonly userPlusIcon = UserPlus;
  readonly mailIcon = Mail;
  readonly shieldIcon = ShieldCheck;
  readonly arrowRightIcon = ArrowRight;
  readonly checkIcon = CheckCircle2;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;

  readonly startForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+?51)?9\d{8}$/)]],
    identityDocumentNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly verifyForm = this.formBuilder.nonNullable.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly completeForm = this.formBuilder.nonNullable.group(
    {
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [confirmPasswordValidator] },
  );

  constructor() {
    this.restoreFlowState();
  }

  submitStart(): void {
    if (this.startForm.invalid) {
      this.startForm.markAllAsTouched();
      return;
    }

    const payload: StartCustomerRegistrationRequest = {
      ...this.startForm.getRawValue(),
      email: this.startForm.getRawValue().email.trim(),
    };

    this.clearMessages();
    this.isSubmittingStart.set(true);

    this.authService
      .startCustomerRegistration(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmittingStart.set(false);
          this.currentStep.set('verify');
          this.expiresInMinutes.set(response.expiresInMinutes);
          this.verifyForm.patchValue({ email: response.email, code: '' });
          this.completeForm.patchValue({ email: response.email });
          this.verifiedCode.set('');
          this.notificationService.success(response.message || 'Te enviamos un código a tu correo.');
          this.persistFlowState({
            step: 'verify',
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            identityDocumentNumber: payload.identityDocumentNumber,
            email: response.email,
            code: '',
            isCodeVerified: false,
            expiresInMinutes: response.expiresInMinutes,
          });
        },
        error: (error) => {
          this.isSubmittingStart.set(false);
          this.notificationService.error(getApiErrorMessage(error, 'No se pudo iniciar el registro.'));
        },
      });
  }

  submitVerify(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const payload: VerifyCustomerRegistrationCodeRequest = {
      email: this.verifyForm.getRawValue().email.trim(),
      code: this.verifyForm.getRawValue().code.trim(),
    };

    this.clearMessages();
    this.isSubmittingVerify.set(true);

    this.authService
      .verifyCustomerRegistrationCode(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmittingVerify.set(false);

          if (!response.isVerified) {
            this.notificationService.error('No se pudo verificar el código.');
            return;
          }

          this.currentStep.set('complete');
          this.verifiedCode.set(payload.code);
          this.notificationService.success(response.message || 'Código verificado.');
          this.persistFlowState({
            ...this.getFlowState(),
            step: 'complete',
            email: response.email,
            code: payload.code,
            isCodeVerified: true,
          });
        },
        error: (error) => {
          this.isSubmittingVerify.set(false);
          this.notificationService.error(getApiErrorMessage(error, 'No se pudo verificar el código.'));
        },
      });
  }

  resendCode(): void {
    const email = this.verifyForm.getRawValue().email.trim();

    if (!email) {
      this.notificationService.error('No se encontró el email del registro.');
      return;
    }

    const payload: ResendCustomerRegistrationCodeRequest = { email };
    this.clearMessages();
    this.isResendingCode.set(true);

    this.authService
      .resendCustomerRegistrationCode(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isResendingCode.set(false);
          this.expiresInMinutes.set(response.expiresInMinutes);
          this.notificationService.success(response.message || 'Te enviamos un nuevo código a tu correo.');
          this.persistFlowState({
            ...this.getFlowState(),
            step: 'verify',
            email: response.email,
            code: '',
            isCodeVerified: false,
            expiresInMinutes: response.expiresInMinutes,
          });
        },
        error: (error) => {
          this.isResendingCode.set(false);
          this.notificationService.error(getApiErrorMessage(error, 'No se pudo reenviar el código.'));
        },
      });
  }

  submitComplete(): void {
    if (this.completeForm.invalid) {
      this.completeForm.markAllAsTouched();
      return;
    }

    const email = this.completeForm.getRawValue().email.trim();
    const code = this.verifiedCode().trim();

    if (!email || !code) {
      this.notificationService.warning('Debes verificar el código antes de completar el registro.');
      this.goToVerify();
      return;
    }

    const payload: CompleteCustomerRegistrationRequest = {
      email,
      code,
      password: this.completeForm.getRawValue().password,
      acceptedDocumentIds: this.acceptedLegalDocumentIds(),
      platform: 'web',
    };

    this.clearMessages();
    this.isSubmittingComplete.set(true);

    this.authService
      .completeCustomerRegistration(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmittingComplete.set(false);
          this.clearPersistedFlowState();
          this.notificationService.success('Cuenta creada correctamente.');
          void this.router.navigateByUrl('/restaurants');
        },
        error: (error) => {
          this.isSubmittingComplete.set(false);
          this.notificationService.error(getApiErrorMessage(error, 'No se pudo completar el registro.'));
        },
      });
  }

  goToStart(): void {
    this.clearMessages();
    this.currentStep.set('start');
    this.persistFlowState({ ...this.getFlowState(), step: 'start', code: '', isCodeVerified: false });
  }

  goToVerify(): void {
    const email = this.verifyForm.getRawValue().email.trim();

    if (!email) {
      this.goToStart();
      return;
    }

    this.clearMessages();
    this.currentStep.set('verify');
    this.persistFlowState({ ...this.getFlowState(), step: 'verify', email, isCodeVerified: false });
  }

  private restoreFlowState(): void {
    const savedState = this.readFlowState();

    if (!savedState) {
      return;
    }

    this.startForm.patchValue({
      firstName: savedState.firstName,
      lastName: savedState.lastName,
      phone: savedState.phone,
      identityDocumentNumber: savedState.identityDocumentNumber ?? '',
      email: savedState.email,
    });
    this.verifyForm.patchValue({
      email: savedState.email,
      code: savedState.step === 'verify' ? savedState.code : '',
    });
    this.completeForm.patchValue({
      email: savedState.email,
      password: '',
      confirmPassword: '',
    });
    this.expiresInMinutes.set(savedState.expiresInMinutes);
    this.verifiedCode.set(savedState.isCodeVerified ? savedState.code : '');

    if (savedState.step === 'complete' && savedState.isCodeVerified && savedState.email && savedState.code) {
      this.currentStep.set('complete');
      return;
    }

    if ((savedState.step === 'verify' || savedState.step === 'complete') && savedState.email) {
      this.currentStep.set('verify');
      return;
    }

    this.currentStep.set('start');
  }

  private getFlowState(): RegisterFlowState {
    return {
      step: this.currentStep(),
      firstName: this.startForm.controls.firstName.value.trim(),
      lastName: this.startForm.controls.lastName.value.trim(),
      phone: this.startForm.controls.phone.value.trim(),
      identityDocumentNumber: this.startForm.controls.identityDocumentNumber.value.trim(),
      email: this.startForm.controls.email.value.trim() || this.verifyForm.getRawValue().email.trim(),
      code: this.verifiedCode() || this.verifyForm.controls.code.value.trim(),
      isCodeVerified: this.currentStep() === 'complete' && !!this.verifiedCode(),
      expiresInMinutes: this.expiresInMinutes(),
    };
  }

  private persistFlowState(state: RegisterFlowState): void {
    try {
      sessionStorage.setItem(REGISTER_FLOW_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures so the flow keeps working.
    }
  }

  private readFlowState(): RegisterFlowState | null {
    try {
      const rawValue = sessionStorage.getItem(REGISTER_FLOW_STORAGE_KEY);
      if (!rawValue) {
        return null;
      }
      return JSON.parse(rawValue) as RegisterFlowState;
    } catch {
      return null;
    }
  }

  private clearPersistedFlowState(): void {
    try {
      sessionStorage.removeItem(REGISTER_FLOW_STORAGE_KEY);
    } catch {
      // Ignore storage failures so the flow keeps working.
    }
  }

  private clearMessages(): void {
    // No-op: notifications are handled globally with sonner toasts.
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
