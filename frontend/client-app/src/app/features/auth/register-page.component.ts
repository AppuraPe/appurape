import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CompleteCustomerRegistrationRequest,
  ResendCustomerRegistrationCodeRequest,
  StartCustomerRegistrationRequest,
  VerifyCustomerRegistrationCodeRequest,
} from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

type RegisterStep = 'start' | 'verify' | 'complete';

type RegisterFlowState = {
  step: RegisterStep;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  code: string;
  isCodeVerified: boolean;
  expiresInMinutes: number | null;
};

const REGISTER_FLOW_STORAGE_KEY = 'iquitosDelivery.client.register-flow';

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
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  template: `
    <section class="page-shell">
      <div class="split" style="align-items: start;">
        <div class="hero-card">
          <app-page-header
            eyebrow="Cuenta customer"
            title="Crea tu cuenta AppuraPe con verificacion por correo"
            subtitle="Primero registramos tus datos, luego validamos un codigo de 6 digitos y finalmente creas tu contrasena."
          />
          <div class="hero-actions">
            <span class="badge success">Correo verificado</span>
            <span class="badge">Sin login social</span>
          </div>
        </div>

        <div class="app-card elevated">
        <app-page-header
          eyebrow="Registro"
          title="Crear cuenta en AppuraPe"
          subtitle="Registra tus datos, verifica tu correo y crea tu contrasena."
        />

        <div class="status-steps">
          <span class="status-pill" [class.active-step]="currentStep() === 'start'">1. Datos</span>
          <span class="status-pill" [class.active-step]="currentStep() === 'verify'">2. Codigo</span>
          <span class="status-pill" [class.active-step]="currentStep() === 'complete'">3. Contrasena</span>
        </div>

        @if (currentStep() === 'start') {
          <form class="form-grid" style="margin-top: 1rem;" [formGroup]="startForm" (ngSubmit)="submitStart()">
            <div class="form-grid two-col">
              <div class="field">
                <label for="firstName">Nombres</label>
                <input id="firstName" type="text" formControlName="firstName" />
                @if (startForm.controls.firstName.invalid && startForm.controls.firstName.touched) {
                  <span class="field-error">Los nombres son obligatorios.</span>
                }
              </div>

              <div class="field">
                <label for="lastName">Apellidos</label>
                <input id="lastName" type="text" formControlName="lastName" />
                @if (startForm.controls.lastName.invalid && startForm.controls.lastName.touched) {
                  <span class="field-error">Los apellidos son obligatorios.</span>
                }
              </div>
            </div>

            <div class="form-grid two-col">
              <div class="field">
                <label for="phone">Telefono</label>
                <input id="phone" type="tel" formControlName="phone" />
                @if (startForm.controls.phone.invalid && startForm.controls.phone.touched) {
                  <span class="field-error">El telefono es obligatorio.</span>
                }
              </div>

              <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" formControlName="email" />
                @if (startForm.controls.email.invalid && startForm.controls.email.touched) {
                  <span class="field-error">Ingresa un email valido.</span>
                }
              </div>
            </div>

            <div class="button-row">
              <button class="button primary-action" type="submit" [disabled]="isSubmittingStart()">
                {{ isSubmittingStart() ? 'Enviando...' : 'Enviar codigo' }}
              </button>
              <a class="button ghost" routerLink="/login">Ya tengo cuenta</a>
            </div>
          </form>
        }

        @if (currentStep() === 'verify') {
          <form class="form-grid" style="margin-top: 1rem;" [formGroup]="verifyForm" (ngSubmit)="submitVerify()">
            <div class="field">
              <label for="verifyEmail">Email</label>
              <input id="verifyEmail" type="email" formControlName="email" readonly />
            </div>

            <div class="field">
              <label for="code">Codigo de verificacion</label>
              <input id="code" type="text" formControlName="code" placeholder="123456" maxlength="6" />
              @if (verifyForm.controls.code.invalid && verifyForm.controls.code.touched) {
                <span class="field-error">Ingresa un codigo de 6 digitos.</span>
              }
            </div>

            @if (expiresInMinutes()) {
              <div class="alert info">
                <strong class="alert-title">Revisa tu correo</strong>
                <span>Te enviamos un codigo. Expira en {{ expiresInMinutes() }} minutos.</span>
              </div>
            }

            <div class="button-row">
              <button class="button primary-action" type="submit" [disabled]="isSubmittingVerify()">
                {{ isSubmittingVerify() ? 'Verificando...' : 'Verificar codigo' }}
              </button>
              <button class="button ghost" type="button" (click)="resendCode()" [disabled]="isResendingCode()">
                {{ isResendingCode() ? 'Reenviando...' : 'Reenviar codigo' }}
              </button>
              <button class="button secondary" type="button" (click)="goToStart()">Editar datos</button>
            </div>
          </form>
        }

        @if (currentStep() === 'complete') {
          <form class="form-grid" style="margin-top: 1rem;" [formGroup]="completeForm" (ngSubmit)="submitComplete()">
            <div class="field">
              <label for="completeEmail">Email</label>
              <input id="completeEmail" type="email" formControlName="email" readonly />
            </div>

            <div class="field">
              <label for="password">Contrasena</label>
              <input id="password" type="password" formControlName="password" />
              @if (completeForm.controls.password.invalid && completeForm.controls.password.touched) {
                <span class="field-error">La contrasena debe tener al menos 6 caracteres.</span>
              }
            </div>

            <div class="field">
              <label for="confirmPassword">Confirmar contrasena</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword" />
              @if (completeForm.hasError('passwordMismatch') && completeForm.controls.confirmPassword.touched) {
                <span class="field-error">Las contrasenas no coinciden.</span>
              }
            </div>

            <div class="alert success">
              <strong class="alert-title">Codigo verificado</strong>
              <span>Ahora crea tu contrasena para activar la cuenta.</span>
            </div>

            <div class="button-row">
              <button class="button primary-action" type="submit" [disabled]="isSubmittingComplete()">
                {{ isSubmittingComplete() ? 'Creando cuenta...' : 'Completar registro' }}
              </button>
              <button class="button ghost" type="button" (click)="goToVerify()">Volver al codigo</button>
              <a class="button secondary" routerLink="/login">Ir a login</a>
            </div>
          </form>
        }
        </div>
      </div>
    </section>
  `,
  styles: `
    .status-steps {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .active-step {
      background: var(--brand-700);
      color: #fff;
    }
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

  readonly startForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
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
          this.verifyForm.patchValue({
            email: response.email,
            code: '',
          });
          this.completeForm.patchValue({
            email: response.email,
          });
          this.verifiedCode.set('');
          this.notificationService.success(response.message || 'Te enviamos un codigo a tu correo.');
          this.persistFlowState({
            step: 'verify',
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
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
            this.notificationService.error('No se pudo verificar el codigo.');
            return;
          }

          this.currentStep.set('complete');
          this.verifiedCode.set(payload.code);
          this.notificationService.success(response.message || 'Codigo verificado.');
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
          this.notificationService.error(getApiErrorMessage(error, 'No se pudo verificar el codigo.'));
        },
      });
  }

  resendCode(): void {
    const email = this.verifyForm.getRawValue().email.trim();

    if (!email) {
      this.notificationService.error('No se encontro el email del registro.');
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
          this.notificationService.success(response.message || 'Te enviamos un nuevo codigo a tu correo.');
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
          this.notificationService.error(getApiErrorMessage(error, 'No se pudo reenviar el codigo.'));
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
      this.notificationService.warning('Debes verificar el codigo antes de completar el registro.');
      this.goToVerify();
      return;
    }

    const payload: CompleteCustomerRegistrationRequest = {
      email,
      code,
      password: this.completeForm.getRawValue().password,
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
    this.persistFlowState({
      ...this.getFlowState(),
      step: 'start',
      code: '',
      isCodeVerified: false,
    });
  }

  goToVerify(): void {
    const email = this.verifyForm.getRawValue().email.trim();

    if (!email) {
      this.goToStart();
      return;
    }

    this.clearMessages();
    this.currentStep.set('verify');
    this.persistFlowState({
      ...this.getFlowState(),
      step: 'verify',
      email,
      isCodeVerified: false,
    });
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
}
