import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from './core/footer/footer';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Footer],
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  noScrollMain = false;
  private readonly isBrowser: boolean;
  protected readonly title = signal('logisticasoft-frontend');

  showFooter = true;
  noFooter = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.updateLayout(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateLayout(this.router.url);
      });
  }

  private updateLayout(urlWithQuery: string): void {
    const url = urlWithQuery.split('?')[0];

    const isHome = url === '/' || url.startsWith('/home');
    const isLogin = url.startsWith('/login');
    const isSeguimiento = url.startsWith('/seguimiento');
    const isDashboard = url.startsWith('/dashboard');
    const isCliente = url.startsWith('/cliente');

    this.showFooter = isHome || isSeguimiento;

    this.noFooter = isDashboard || isLogin || isCliente;
    this.noScrollMain = isLogin;

    if (this.isBrowser) {
      document.body.style.overflow = isLogin ? 'hidden' : 'auto';
    }
  }
}