import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environment';
import { PortalType } from './auth.models';

@Injectable({ providedIn: 'root' })
export class ClerkAuthService {
  private clerkPromise: Promise<any | null> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async getClerk(): Promise<any | null> {
    if (!this.isBrowser()) {
      return null;
    }

    if (this.clerkPromise) {
      return this.clerkPromise;
    }

    this.clerkPromise = (async () => {
      const publishableKey = this.getPublishableKey();
      const [{ Clerk }, { ui }] = await Promise.all([
        import('@clerk/clerk-js'),
        import('@clerk/ui'),
      ]);

      const clerk = new Clerk(publishableKey);
      await clerk.load({ ui });

      console.info('[Clerk] SDK cargado correctamente con UI components.');
      return clerk;
    })();

    return this.clerkPromise;
  }

  async isSignedIn(): Promise<boolean> {
    const clerk = await this.getClerk();
    return !!clerk?.isSignedIn && !!clerk?.session;
  }

  async getToken(): Promise<string | null> {
    const clerk = await this.getClerk();

    if (!clerk?.session) {
      return null;
    }

    return clerk.session.getToken();
  }

  async signIn(portal: PortalType): Promise<void> {
    const clerk = await this.getClerk();

    if (!clerk || !this.isBrowser()) {
      return;
    }

    sessionStorage.setItem('ls_portal_intent', portal);

    const redirectUrl =
      `${window.location.origin}/auth/callback?portal=${portal}&source=clerk`;

    await clerk.redirectToSignIn({
      signInForceRedirectUrl: redirectUrl,
      signUpForceRedirectUrl: redirectUrl,
    } as any);
  }

  async mountSignIn(target: HTMLDivElement, portal: PortalType): Promise<void> {
    const clerk = await this.getClerk();

    if (!clerk || !this.isBrowser()) {
      return;
    }

    sessionStorage.setItem('ls_portal_intent', portal);

    const redirectUrl =
      `${window.location.origin}/auth/callback?portal=${portal}&source=clerk`;

    clerk.mountSignIn(target, {
      forceRedirectUrl: redirectUrl,
      fallbackRedirectUrl: redirectUrl,
      signUpForceRedirectUrl: redirectUrl,
      signUpFallbackRedirectUrl: redirectUrl,
      afterSignOutUrl: `${window.location.origin}/home`,
      appearance: this.getSignInAppearance(portal),
    } as any);
  }

  async unmountSignIn(target: HTMLDivElement): Promise<void> {
    const clerk = await this.getClerk();

    if (!clerk || !this.isBrowser()) {
      return;
    }

    clerk.unmountSignIn(target);
  }

  async signOut(): Promise<void> {
    const clerk = await this.getClerk();

    if (!clerk || !clerk.isSignedIn) {
      return;
    }

    await clerk.signOut();
  }

  async waitForToken(maxAttempts = 20, delayMs = 250): Promise<string | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const token = await this.getToken();

      if (token) {
        return token;
      }

      await this.delay(delayMs);
    }

    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  preload(): void {
    if (this.isBrowser()) {
      void this.getClerk();
    }
  }

  private getSignInAppearance(portal: PortalType): any {
    const portalColors: Record<PortalType, string> = {
      cliente: '#2563eb',
      transportista: '#16a34a',
      deposito: '#7c3aed',
    };

    const primaryColor = portalColors[portal] ?? '#16a34a';

    return {
      variables: {
        colorPrimary: primaryColor,
        colorText: '#0f172a',
        colorTextSecondary: '#64748b',
        colorBackground: '#ffffff',
        colorInputBackground: '#ffffff',
        colorInputText: '#0f172a',
        borderRadius: '14px',
        fontFamily: 'Inter, Roboto, Arial, sans-serif',
      },
      elements: {
        rootBox: {
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        },

        cardBox: {
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          boxShadow: '0 22px 55px rgba(15, 23, 42, 0.13)',
          border: '1px solid #e2e8f0',
          borderRadius: '22px',
        },
        card: {
          borderRadius: '22px',
        },
        headerTitle: {
          fontSize: '1.15rem',
          fontWeight: '800',
          color: '#0f172a',
        },
        headerSubtitle: {
          color: '#64748b',
        },
        socialButtonsBlockButton: {
          borderRadius: '12px',
          height: '42px',
          fontWeight: '700',
        },
        formButtonPrimary: {
          borderRadius: '12px',
          height: '42px',
          fontWeight: '800',
          boxShadow: 'none',
        },
        formFieldInput: {
          borderRadius: '12px',
          height: '42px',
        },
        footerActionLink: {
          color: primaryColor,
          fontWeight: '800',
        },
      },
    };
  }

  private getPublishableKey(): string {
    const publishableKey = environment.clerkPublishableKey;

    if (typeof publishableKey !== 'string' || !publishableKey.startsWith('pk_test_')) {
      throw new Error(
        'environment.clerkPublishableKey no esta definido como string pk_test_.'
      );
    }

    return publishableKey;
  }
}
