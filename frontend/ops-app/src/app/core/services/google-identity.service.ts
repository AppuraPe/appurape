import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
            },
          ): void;
          cancel(): void;
        };
      };
    };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly document = inject(DOCUMENT);
  private scriptLoadingPromise: Promise<void> | null = null;

  isConfigured(): boolean {
    return !!environment.googleClientId.trim();
  }

  async renderButton(container: HTMLElement, onCredential: (credential: string) => void): Promise<void> {
    if (!this.isConfigured()) {
      container.innerHTML = '';
      return;
    }

    await this.loadScript();

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      throw new Error('Google Identity Services no está disponible.');
    }

    googleIdentity.cancel();
    googleIdentity.initialize({
      client_id: environment.googleClientId,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        }
      },
    });

    container.innerHTML = '';
    googleIdentity.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: Math.max(container.clientWidth, 260),
      logo_alignment: 'left',
    });
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existingScript = this.document.getElementById('google-identity-script') as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services.')), { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
      this.document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }
}
