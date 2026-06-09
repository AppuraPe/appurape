import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';
import { GoogleIdentityService } from './google-identity.service';

@Injectable({ providedIn: 'root' })
export class GoogleSignInService {
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private nativeInitializationPromise: Promise<void> | null = null;

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  isConfigured(): boolean {
    if (this.isNativePlatform()) {
      const platform = Capacitor.getPlatform();

      if (platform === 'ios') {
        return !!environment.googleClientId.trim() && !!environment.googleIosClientId.trim();
      }

      return !!environment.googleClientId.trim();
    }

    return this.googleIdentityService.isConfigured();
  }

  async renderWebButton(container: HTMLElement, onCredential: (credential: string) => void): Promise<void> {
    if (this.isNativePlatform()) {
      container.innerHTML = '';
      return;
    }

    await this.googleIdentityService.renderButton(container, onCredential);
  }

  async signInNative(): Promise<string> {
    if (!this.isNativePlatform()) {
      throw new Error('El login nativo con Google solo está disponible dentro de la app móvil.');
    }

    if (!this.isConfigured()) {
      throw new Error('Falta configurar Google Sign-In para esta plataforma.');
    }

    await this.initializeNative();

    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    const response = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['email', 'profile'],
      },
    });

    if (response.result.responseType !== 'online' || !response.result.idToken) {
      throw new Error('Google no devolvió un token válido para iniciar sesión.');
    }

    return response.result.idToken;
  }

  private async initializeNative(): Promise<void> {
    if (this.nativeInitializationPromise) {
      return this.nativeInitializationPromise;
    }

    this.nativeInitializationPromise = this.doInitializeNative();
    return this.nativeInitializationPromise;
  }

  private async doInitializeNative(): Promise<void> {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');

    await SocialLogin.initialize({
      google: {
        webClientId: environment.googleClientId,
        iOSClientId: environment.googleIosClientId || undefined,
        iOSServerClientId: environment.googleIosServerClientId || undefined,
        mode: 'online',
      },
    });
  }
}
