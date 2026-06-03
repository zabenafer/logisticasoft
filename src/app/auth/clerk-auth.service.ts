import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Clerk } from '@clerk/clerk-js';
import { environment } from '../../environment';
import { PortalType } from './auth.models';

type ClerkInstance = InstanceType<typeof Clerk>;

@Injectable({ providedIn: 'root' })
export class ClerkAuthService {
  private clerkPromise: Promise<ClerkInstance | null> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async getClerk(): Promise<ClerkInstance | null> {
    if (!this.isBrowser()) {
      return null;
    }

    if (this.clerkPromise) {
      return this.clerkPromise;
    }

    this.clerkPromise = (async () => {
      const clerk = new Clerk(environment.clerkPublishableKey);
      await clerk.load();
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
}